
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ChangePasswordResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export async function changePasswordAction(
  formData: FormData
): Promise<ChangePasswordResult> {
  // Mengambil password baru
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return {
      success: false,
      message: "Data password tidak valid.",
    };
  }

  // Validasi password di sisi server
  if (newPassword.length < 8) {
    return {
      success: false,
      message: "Password baru minimal 8 karakter.",
    };
  }

  if (newPassword.length > 128) {
    return {
      success: false,
      message: "Password maksimal 128 karakter.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      message: "Konfirmasi password tidak cocok.",
    };
  }

  // Memeriksa session pengguna
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      message: "Sesi login tidak ditemukan. Silakan login kembali.",
    };
  }

  // Memeriksa profil dan kewajiban mengganti password
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active, must_change_password")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active) {
    return {
      success: false,
      message: "Profil tidak valid atau akun tidak aktif.",
    };
  }

  if (!profile.must_change_password) {
    return {
      success: false,
      message: "Akun ini tidak memerlukan penggantian password.",
    };
  }

  // Admin Client hanya digunakan di server.
  // Target user selalu diambil dari session, bukan input browser.
  const admin = createAdminClient();

  // Memperbarui password akun yang sedang login
  const { error: passwordError } =
    await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

  if (passwordError) {
    return {
      success: false,
      message: `Gagal memperbarui password: ${passwordError.message}`,
    };
  }

  // Menonaktifkan kewajiban ganti password
  const { data: updatedProfile, error: updateProfileError } =
    await admin
      .from("profiles")
      .update({
        must_change_password: false,
      })
      .eq("id", user.id)
      .eq("must_change_password", true)
      .select("id")
      .maybeSingle();

  if (updateProfileError || !updatedProfile) {
    console.error(
      "Gagal memperbarui status password:",
      updateProfileError
    );

    return {
      success: false,
      message:
        "Password sudah diperbarui, tetapi status akun belum berhasil diperbarui. Silakan coba lagi.",
    };
  }

  return {
    success: true,
  };
}
