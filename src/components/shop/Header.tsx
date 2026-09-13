import Link from 'next/link';
import { CartSheet } from '@/components/shop/CartSheet';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { signOutAction } from '@/actions/auth';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl font-bold tracking-tight text-amber-900">
            Velours Patisserie
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <div className="flex items-center gap-3">
              {session.user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Admin</Button>
                </Link>
              )}
              <Link href="/my-orders">
                <Button variant="ghost" size="sm">My Orders</Button>
              </Link>
              <form action={signOutAction}>
                <Button type="submit" variant="outline" size="sm">Sign Out</Button>
              </form>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}
          <CartSheet />
        </div>
      </div>
    </header>
  );
}
