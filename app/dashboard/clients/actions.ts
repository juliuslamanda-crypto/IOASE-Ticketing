
"use server";

import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type RegisterClientResult =
  | {
      success: true;
      companyName: string;
      email: string;
      initialPassword: string;
    }
  | {
      success: false;
      message: string;
    };

export async function registerClientAction(
  formData: FormData
): Promise<RegisterClientResult> {
  // 1. Memeriksa pengguna yang sedang login
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "Sesi login tidak valid. Silakan login kembali.",
    };
  }

  // 2. Memastikan pembuat akun adalah Admin atau Super Admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    return {
      success: false,
      message: "Anda tidak memiliki izin untuk membuat akun Klien.",
    };
  }

  // 3. Mengambil dan memvalidasi input
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const productIds = [
    ...new Set(
      formData
        .getAll("productIds")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];

  if (!fullName || !email || !companyName) {
    return {
      success: false,
      message: "Nama Klien, email, dan nama perusahaan wajib diisi.",
    };
  }

  if (fullName.length > 120 || companyName.length > 150) {
    return {
      success: false,
      message: "Nama terlalu panjang.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      message: "Format email tidak valid.",
    };
  }

  if (productIds.length === 0) {
    return {
      success: false,
      message: "Pilih minimal satu produk untuk perusahaan Klien.",
    };
  }

  // 4. Menggunakan Supabase Admin Client hanya di server
  const admin = createAdminClient();

  // Memastikan semua produk yang dipilih aktif
  const { data: validProducts, error: productError } = await admin
    .from("products")
    .select("id")
    .in("id", productIds)
    .eq("is_active", true);

  if (productError) {
    return {
      success: false,
      message: `Gagal memeriksa produk: ${productError.message}`,
    };
  }

  if ((validProducts ?? []).length !== productIds.length) {
    return {
      success: false,
      message: "Ada produk yang tidak ditemukan atau tidak aktif.",
    };
  }

  // Password sementara dibuat secara acak di server.
  // Password ini hanya ditampilkan sekali kepada Admin.
  const initialPassword = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();

  // Menyimpan ID untuk proses pembersihan jika terjadi kegagalan
  let authUserId: string | null = null;
  let clientId: string | null = null;

  async function rollback() {
    if (clientId) {
      await admin
        .from("client_products")
        .delete()
        .eq("client_id", clientId);

      await admin
        .from("client_profiles")
        .delete()
        .eq("id", clientId);
    }

    if (authUserId) {
      await admin.from("profiles").delete().eq("id", authUserId);
      await admin.auth.admin.deleteUser(authUserId);
    }
  }

  // 5. Membuat akun Supabase Auth
  const { data: authData, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

  if (createUserError || !authData.user) {
    return {
      success: false,
      message:
        createUserError?.message ?? "Gagal membuat akun autentikasi.",
    };
  }

  authUserId = authData.user.id;

  try {
    // 6. Membuat profil pengguna dengan role Klien
    const { error: profileInsertError } = await admin
      .from("profiles")
      .insert({
        id: authUserId,
        full_name: fullName,
        role: "client",
        is_active: true,
        must_change_password: true,
        created_by_user_id: user.id,
      });

    if (profileInsertError) {
      throw new Error(
        `Gagal membuat profil Klien: ${profileInsertError.message}`
      );
    }

    // 7. Membuat data perusahaan
    const { data: client, error: clientInsertError } = await admin
      .from("client_profiles")
      .insert({
        user_id: authUserId,
        company_name: companyName,
        contact_person: contactPerson || null,
        phone: phone || null,
      })
      .select("id")
      .single();

    if (clientInsertError || !client) {
      throw new Error(
        `Gagal membuat data perusahaan: ${
          clientInsertError?.message ?? "ID perusahaan tidak ditemukan."
        }`
      );
    }

    clientId = client.id;

    // 8. Menghubungkan perusahaan dengan produk
    const productAssignments = productIds.map((productId) => ({
      client_id: client.id,
      product_id: productId,
      assigned_by_user_id: user.id,
      is_active: true,
    }));

    const { error: assignmentError } = await admin
      .from("client_products")
      .insert(productAssignments);

    if (assignmentError) {
      throw new Error(
        `Gagal menetapkan produk: ${assignmentError.message}`
      );
    }

    // 9. Registrasi berhasil
    return {
      success: true,
      companyName,
      email,
      initialPassword,
    };
  } catch (error) {
    await rollback();

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mendaftarkan Klien.",
    };
  } 
}
    

export async function resetClientPasswordAction(targetUserId: string) {
  // Memeriksa Admin yang sedang login
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false as const,
      message: "Sesi login tidak valid.",
    };
  }

  // Memeriksa kewenangan Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    !profile.is_active ||
    !["admin", "super_admin"].includes(profile.role)
  ) {
    return {
      success: false as const,
      message: "Anda tidak memiliki izin untuk mereset password.",
    };
  }

  if (!targetUserId) {
    return {
      success: false as const,
      message: "ID pengguna tidak valid.",
    };
  }

  const admin = createAdminClient();

  // Memastikan target adalah akun Klien
  const { data: targetProfile, error: targetError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (
    targetError ||
    !targetProfile ||
    targetProfile.role !== "client"
  ) {
    return {
      success: false as const,
      message: "Akun Klien tidak ditemukan.",
    };
  }

  const { data: client, error: clientError } = await admin
    .from("client_profiles")
    .select("id")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (clientError || !client) {
    return {
      success: false as const,
      message: "Data perusahaan Klien tidak ditemukan.",
    };
  }

  // Membuat password sementara baru
  const temporaryPassword = randomBytes(24).toString("base64url");

  // Memperbarui password melalui Supabase Admin API
  const { error: updateError } =
    await admin.auth.admin.updateUserById(targetUserId, {
      password: temporaryPassword,
    });

  if (updateError) {
    return {
      success: false as const,
      message: updateError.message,
    };
  }

  // Menandai akun agar password perlu diganti
  const { error: flagError } = await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", targetUserId);

  if (flagError) {
    console.error("Gagal memperbarui flag password:", flagError);
  }

  return {
    success: true as const,
    temporaryPassword,
  };
}
