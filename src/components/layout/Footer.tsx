"use client"
import Image from "next/image";
import Link from "next/link";
import { SVGProps } from "react";

const navigation = [
  {
    name: "X",
    href: "https://x.com/hodlCoinStaking",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
      </svg>
    ),
  },
  {
    name: "X2",
    href: "https://x.com/StabilityNexus",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/stability-nexus",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g id="SVGRepo_iconCarrier">
          <g>
            <path d="M2.5 18h3V6.9h-3V18zM4 2c-1 0-1.8.8-1.8 1.8S3 5.6 4 5.6s1.8-.8 1.8-1.8S5 2 4 2zm6.6 6.6V6.9h-3V18h3v-5.7c0-3.2 4.1-3.4 4.1 0V18h3v-6.8c0-5.4-5.7-5.2-7.1-2.6z" />
          </g>
        </g>
      </svg>
    ),
  },
  {
    name: "GitHub",
    href: "https://github.com/StabilityNexus",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "https://t.me/StabilityNexus",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12.3583 9.38244C11.3857 9.787 9.44177 10.6243 6.52657 11.8944C6.05318 12.0827 5.8052 12.2669 5.78263 12.4469C5.74448 12.7513 6.12559 12.8711 6.64455 13.0343C6.71515 13.0565 6.78829 13.0795 6.86327 13.1038C7.37385 13.2698 8.06068 13.464 8.41773 13.4717C8.74161 13.4787 9.1031 13.3452 9.50219 13.0711C12.226 11.2325 13.632 10.3032 13.7202 10.2831C13.7825 10.269 13.8688 10.2512 13.9273 10.3032C13.9858 10.3552 13.98 10.4536 13.9738 10.48C13.9361 10.641 12.4401 12.0318 11.6659 12.7515C11.4246 12.9759 11.2534 13.135 11.2184 13.1714C11.14 13.2528 11.0601 13.3298 10.9833 13.4038C10.509 13.8611 10.1532 14.204 11.003 14.764C11.4114 15.0331 11.7381 15.2556 12.0641 15.4776C12.4201 15.7201 12.7752 15.9619 13.2347 16.2631C13.3517 16.3398 13.4635 16.4195 13.5724 16.4971C13.9867 16.7925 14.3589 17.0579 14.8188 17.0155C15.086 16.991 15.362 16.7397 15.5022 15.9903C15.8335 14.2193 16.4847 10.382 16.6352 8.80081C16.6484 8.66228 16.6318 8.48498 16.6185 8.40715C16.6051 8.32932 16.5773 8.21842 16.4761 8.13633C16.3563 8.03911 16.1714 8.01861 16.0886 8.02C15.7125 8.0267 15.1354 8.22735 12.3583 9.38244Z"
          ></path>{" "}
        </g>
      </svg>
    ),
  },
  {
    name: "Discord",
    href: "https://discord.gg/YzDKeEfWtS",
    icon: (props: SVGProps<SVGSVGElement>) => (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g
          id="SVGRepo_tracerCarrier"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></g>
        <g id="SVGRepo_iconCarrier">
          {" "}
          <path d="M18.59 5.88997C17.36 5.31997 16.05 4.89997 14.67 4.65997C14.5 4.95997 14.3 5.36997 14.17 5.69997C12.71 5.47997 11.26 5.47997 9.83001 5.69997C9.69001 5.36997 9.49001 4.95997 9.32001 4.65997C7.94001 4.89997 6.63001 5.31997 5.40001 5.88997C2.92001 9.62997 2.25001 13.28 2.58001 16.87C4.23001 18.1 5.82001 18.84 7.39001 19.33C7.78001 18.8 8.12001 18.23 8.42001 17.64C7.85001 17.43 7.31001 17.16 6.80001 16.85C6.94001 16.75 7.07001 16.64 7.20001 16.54C10.33 18 13.72 18 16.81 16.54C16.94 16.65 17.07 16.75 17.21 16.85C16.7 17.16 16.15 17.42 15.59 17.64C15.89 18.23 16.23 18.8 16.62 19.33C18.19 18.84 19.79 18.1 21.43 16.87C21.82 12.7 20.76 9.08997 18.61 5.88997H18.59ZM8.84001 14.67C7.90001 14.67 7.13001 13.8 7.13001 12.73C7.13001 11.66 7.88001 10.79 8.84001 10.79C9.80001 10.79 10.56 11.66 10.55 12.73C10.55 13.79 9.80001 14.67 8.84001 14.67ZM15.15 14.67C14.21 14.67 13.44 13.8 13.44 12.73C13.44 11.66 14.19 10.79 15.15 10.79C16.11 10.79 16.87 11.66 16.86 12.73C16.86 13.79 16.11 14.67 15.15 14.67Z"></path>{" "}
        </g>
      </svg>
    ),
  },
];

interface FooterProps {
  className?: string;
  onKyaClick?: () => void;
  onShareClick?: () => void;
}

export default function Footer({ className = "", onKyaClick, onShareClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full rounded-lg backdrop-blur-md bg-white/10 dark:bg-black shadow-lg border border-white/10 dark:border-black/10 ${className}`}>
      <div className="px-4 sm:px-8 py-6 space-y-6">
        {/* Logo and Social Links */}
        <div className="flex flex-col md:flex-row">
          <div className="w-full flex mb-4 md:mb-0 justify-between">
            <Link
              href="https://stability.nexus/"
              target="_blank"
              className="cursor-pointer"
            >
              <Image
                src="/logo-animated.gif"
                alt="Fate Protocol"
                width={80}
                height={80}
                className="p-2"
                priority
              />
            </Link>
            <h5 className="text-md sm:hidden md:hidden flex justify-center items-center text-gray-900 dark:text-white">
              A Project by Stability Nexus
            </h5>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target="_blank"
                className="rounded-full bg-white/10 dark:bg-black/10 p-2 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="size-6 text-white-900 dark:text-white" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <Link
            href="https://stability.nexus/protocols"
            target="_blank"
            className="text-white-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline hover:decoration-2"
          >
            Other Protocols
          </Link>
          <Link
            href="https://stability.nexus/research"
            target="_blank"
            className="text-white-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline hover:decoration-2"
          >
            Research
          </Link>
          <Link
            href="https://news.stability.nexus/"
            target="_blank"
            className="text-white-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline hover:decoration-2"
          >
            News
          </Link>
          <Link
            href="https://docs.stability.nexus/"
            target="_blank"
            className="text-white-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline hover:decoration-2"
          >
            Docs
          </Link>
          {onKyaClick && (
            <button
              onClick={onKyaClick}
              className="text-white-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline hover:decoration-2"
            >
              KYA
            </button>
          )}
          {onShareClick && (
            <button
              onClick={onShareClick}
              className="text-white-900 dark:text-white hover:text-yellow-500 dark:hover:text-yellow-400 hover:underline hover:decoration-2"
            >
              Share
            </button>
          )}
        </div>

        {/* Copyright */}
        <div className="text-center pt-4 border-t border-white/10 dark:border-black/10">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            &copy; {currentYear} The Stable Order. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}