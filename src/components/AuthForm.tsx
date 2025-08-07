import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    else window.location.href = "/dashboard";
  };

  useEffect(() => {
    const session = async () => {
      await supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.location.href = "/dashboard";
        }
      });
    };
    session();
  }, []);

  return (
    <form
      className="flex flex-col gap-3 py-4 w-full px-4 md:px-0 md:w-1/2 justify-center items-center mx-auto"
      onSubmit={handleSubmit}
    >
      <h2>Iniciar sesión</h2>
      <input
        className="p-2 border border-gray-300 rounded w-full"
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="p-2 border border-gray-300 rounded w-full"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        className="bg-blue-500 text-white p-2 rounded w-full"
        type="submit"
      >
        Entrar
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
