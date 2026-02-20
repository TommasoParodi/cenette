export default function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button
        type="submit"
        className="rounded-lg px-3 py-1.5 text-sm text-text-secondary hover:text-foreground focus:outline-none focus:underline"
      >
        Esci
      </button>
    </form>
  );
}
