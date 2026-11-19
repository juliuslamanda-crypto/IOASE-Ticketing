
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Package, Save } from "lucide-react";
import { updateClientProductsAction } from "../../actions";

type Product = {
  id: string;
  product_name: string;
  description: string | null;
};

type Props = {
  clientId: string;
  companyName: string;
  products: Product[];
  initialSelectedIds: string[];
};

export default function ManageClientProductsForm({
  clientId,
  companyName,
  products,
  initialSelectedIds,
}: Props) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedIds
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleProduct(productId: string) {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );

    setError("");
    setSuccess("");
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await updateClientProductsAction(
        clientId,
        selectedIds
      );

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(result.message);
      router.refresh();
    } catch (err) {
      console.error("Update produk Klien error:", err);

      setError(
        "Terjadi kesalahan saat memperbarui produk Klien."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* INFORMASI PERUSAHAAN */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Package size={22} />
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Perusahaan Klien
          </p>
          <h2 className="font-bold text-slate-800">
            {companyName}
          </h2>
        </div>
      </div>

      {/* PILIHAN PRODUK */}
      <div className="mt-6">
        <h3 className="font-bold text-slate-800">
          Produk yang Dapat Digunakan
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Centang produk yang ingin diberikan akses kepada perusahaan ini.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Belum ada produk aktif yang tersedia.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {products.map((product) => {
            const checked = selectedIds.includes(product.id);

            return (
              <label
                key={product.id}
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  checked
                    ? "border-blue-300 bg-blue-50/70"
                    : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleProduct(product.id)}
                  disabled={loading}
                  className="mt-1 h-4 w-4 accent-blue-600"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {product.product_name}
                  </p>

                  {product.description && (
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {product.description}
                    </p>
                  )}
                </div>

                {checked && (
                  <CheckCircle2
                    size={19}
                    className="shrink-0 text-blue-600"
                  />
                )}
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          Produk dipilih:{" "}
          <span className="font-bold text-blue-700">
            {selectedIds.length}
          </span>
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Produk yang tidak dipilih akan dinonaktifkan untuk perusahaan ini.
          Riwayat penetapan produk tetap disimpan.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div
          role="status"
          className="mt-5 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700"
        >
          <CheckCircle2 size={19} />
          {success}
        </div>
      )}

      {/* SAVE BUTTON */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || products.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </section>
  );
}
