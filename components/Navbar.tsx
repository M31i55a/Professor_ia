"use client"

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import NavItems from '@/components/NavItems'
import ThemeToggle from '@/components/ThemeToggle'

const Navbar = () => {
  return (
    <nav className="navbar">
            <Link href="/">
                <div className="flex items-center gap-2.5 cursor-pointer">
                    <Image
                        src="/images/logo.png"
                        alt="logo"
                        width={68}
                        height={80}
                    />
                </div>
            </Link>
            <div className="flex items-center gap-8">
                <NavItems />
            </div>

            <header className="flex justify-end items-center p-4 gap-4 h-16">
                <ThemeToggle />
                <Show when="signed-out">
                    <SignInButton />
                    <SignUpButton>
                        <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                        Sign Up
                        </button>
                    </SignUpButton>
                </Show>
                <Show when="signed-in">
                    <UserButton />
                </Show>
            </header>
    </nav>
  )
}

export default Navbar