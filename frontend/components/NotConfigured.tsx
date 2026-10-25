/** Aviso cuando faltan las direcciones de los contratos en `.env.local`. */
export function NotConfigured() {
  return (
    <section className="page-head">
      <h1 className="title">Falta configurar los contratos</h1>
      <p className="hint">
        Completá <code>frontend/.env.local</code> con las direcciones desplegadas (o corré <code>npm run sync</code>{" "}
        después del deploy) y reiniciá el servidor.
      </p>
    </section>
  );
}
