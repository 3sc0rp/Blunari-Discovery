import { auth } from "@/auth";
import { isAdminUser } from "@/app/api/utils/admin";

export async function GET() {
  const session = await auth();
  const user = session?.user || null;
  const isAdmin = user?.email ? await isAdminUser(user.email) : false;
  return Response.json({
    isAuthenticated: Boolean(user),
    isAdmin,
    user: user
      ? { id: user.id, name: user.name, email: user.email, image: user.image }
      : null,
  });
}
