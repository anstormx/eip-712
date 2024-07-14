"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Navbar() {
    return (
        <div className="w-full px-6 border-b border-b-gray-600 py-2 flex justify-between items-center">
            <div className="text-3xl font-bold">
                Message Verifier
            </div>
            <ConnectButton />
        </div>
    );
}   