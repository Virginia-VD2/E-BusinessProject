'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { registerUserAction } from '@/actions/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await registerUserAction(formData);

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push('/login?registered=true');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Link href="/" className="font-serif text-3xl font-bold tracking-tight text-amber-900 block mb-2">
            Velours Patisserie
          </Link>
          <CardTitle className="text-lg font-normal text-muted-foreground">
            Create a new account
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input type="text" name="name" required placeholder="John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email Address</label>
              <Input type="email" name="email" required placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Password</label>
              <Input type="password" name="password" required minLength={6} placeholder="••••••••" />
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold underline ml-1">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
