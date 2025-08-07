import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProtectRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = "/";
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading)
    return <p className="text-center mt-10">Verificando sesión...</p>;

  return <>{children}</>;
}
