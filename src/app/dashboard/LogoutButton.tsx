export default function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button className="mt-4 rounded-xl bg-black px-4 py-2 text-white">
        Logout
      </button>
    </form>
  );
}
