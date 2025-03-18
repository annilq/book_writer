'use client';

import Link from "next/link";
import { User2 } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from './ui/button';

export default function SignIn() {
  const session = useSession()

  if (session.data?.user) {
    return (
      <Button asChild variant="secondary" size="default">
        <Link
          href="/books"
        >
          <User2 className="size-3" />
          {session.data?.user.name}
        </Link>
      </Button>
    )
  } else {
    return (
      <div className="space-y-1">
        <Button
          variant="secondary"
          size="default"
          onClick={() => signIn('github')}
        >
          Sign in
        </Button>
      </div>
    );
  }

}