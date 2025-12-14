'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "./ui/dropdown-menu";
import { User, LogOut, Shield, Github, Sparkles } from 'lucide-react';

export default function SignIn() {
  const session = useSession()

  if (session.data?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-primary/20 transition-all hover:border-primary">
              <AvatarImage src={session.data?.user?.image!} alt={session.data?.user?.name!} />
              <AvatarFallback>{session.data?.user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2" align="end">
          <div className="flex items-center gap-3 p-2 mb-2 bg-muted/50 rounded-md">
             <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={session.data?.user?.image!} alt={session.data?.user?.name!} />
              <AvatarFallback>{session.data?.user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5">
              <div className="text-sm font-semibold leading-none">{session.data?.user?.name}</div>
              <div className="text-xs text-muted-foreground truncate w-[140px]">{session.data?.user?.email}</div>
            </div>
          </div>
          
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-1">
            Account
          </DropdownMenuLabel>
          
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/profile" className="flex items-center gap-2 w-full">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            
            {/* @ts-ignore */}
            {session.data?.user?.role === "ADMIN" && (
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/admin/users" className="flex items-center gap-2 w-full">
                  <Shield className="h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2" />
          
          <DropdownMenuItem 
            onClick={() => signOut()}
            className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  } else {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => signIn('github')}
        className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5 group transition-all duration-300"
      >
        <Github className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span>Sign in</span>
        <Sparkles className="h-3 w-3 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Button>
    );
  }
}
