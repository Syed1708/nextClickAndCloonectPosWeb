import Link from "next/link";

// src/app/success/page.tsx
export default function SuccessPage() {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100 text-center p-4">
      <div className="bg-white p-10 rounded-lg shadow-lg">
        <div className="text-6xl mb-4 text-green-500">✔️</div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Paiement Réussi !</h1>
        <p className="text-gray-600">
          Votre commande a été envoyée en cuisine. Elle sera prête dans quelques minutes !
        </p>
        <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Retourner au Menu
        </Link>
      </div>
    </div>
  );
}