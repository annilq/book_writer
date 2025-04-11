'use client';

import { signIn, useSession } from 'next-auth/react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export default function SignIn() {
  const session = useSession()

  if (session.data?.user) {
    return (
      <Avatar className="h-9 w-9">
        <AvatarImage src={session.data?.user?.image!} alt={session.data?.user?.name!} />
        <AvatarFallback>{session.data?.user?.name}</AvatarFallback>
      </Avatar>
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