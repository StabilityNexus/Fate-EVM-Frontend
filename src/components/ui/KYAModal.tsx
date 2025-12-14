"use client"

import { useEffect } from "react";
import Link from "next/link";

interface KYAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KYAModal({ isOpen, onClose }: KYAModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 dark:from-yellow-500/20 dark:to-yellow-600/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Know Your Assumptions (KYA)
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 space-y-4 text-gray-700 dark:text-gray-300 max-h-[calc(90vh-140px)]">
          <p className="text-lg leading-relaxed">
            This decentralized application is composed of smart contracts running on a blockchain
            and a website that eases your interaction with the smart contracts.
          </p>

          <p className="leading-relaxed">
            The smart contracts and the website were developed by The Stable Order,
            an organization dedicated to making the world more stable.
          </p>

          <p className="leading-relaxed">
            The source code of the smart contracts and of the website can be found in{" "}
            <Link
              href="https://github.com/StabilityNexus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 underline font-medium"
            >
              https://github.com/StabilityNexus
            </Link>
            . We strongly recommend that you do your own research and inspect the source code of any blockchain application that you wish to interact with.
            The source code is the only source of truth about the applications that you use.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Please note:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                When you interact with any smart contract on any blockchain through any application, your transactions are recorded anonymously forever on the blockchain.
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>Transactions are final and irreversible once they are confirmed on the blockchain.</li>
                </ul>
              </li>
              <li>
                The smart contracts made by The Stable Order are immutable and autonomous.
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>No one can change or update the smart contracts deployed on the blockchain.</li>
                  <li>The smart contracts are executed autonomously by the blockchain&apos;s block validators.</li>
                </ul>
              </li>
              <li>
                The websites made by The Stable Order are lean static serverless frontends.
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>They do not collect your data on any server.</li>
                  <li>They rely solely on data available publicly on blockchains or on data stored locally in your own device.</li>
                  <li>You may run the websites locally in your own computer. So, even if, for any reason, the websites deployed in our own domains become unavailable, you can still interact with the smart contracts.</li>
                </ul>
              </li>
              <li>Some of our projects may depend on external infrastructure, such as oracles and blockchain explorers.</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Interacting with blockchain applications may involve risks such as the following (non-exhaustively):</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>You may lose your wallet password, recovery phrases or private keys, thereby losing access to your assets.</li>
              <li>Hackers may succeed in obtaining your wallet password, recovery phrases or private keys, thereby gaining access to your assets.</li>
              <li>The blockchain may become congested or unavailable, resulting in delays in the confirmation of your transactions.</li>
              <li>If you are interacting with a centralized blockchain (a.k.a. &quot;L2&quot;, &quot;sidechain&quot;, &quot;Proof-of-Authority blockchain&quot;, ...), the block validators may decide to stop operating the blockchain.</li>
              <li>The external infrastructure on which a decentralized application depends may experience issues or become unavailable.
                <ul className="list-circle list-inside ml-6 mt-1">
                  <li>Oracles, in particular, may suffer delays or manipulations.</li>
                </ul>
              </li>
              <li>The source code of the smart contracts and the website may contain bugs that may cause the application to behave unexpectedly and unfavourably.</li>
              <li>The algorithms and protocols implemented by the code may have unforeseen behaviors.</li>
            </ul>
          </div>

          <p className="leading-relaxed text-sm">
            While we do our best to ensure that we implement good algorithms and protocols, that the implementations are free from bugs, and that the deployed applications are fully or minimally dependent
            on external infrastructure, you use the applications at your own risk. You are solely responsible for your assets. You are solely responsible for the security of your wallet (and its password, recovery phrase and private keys).
            The Stable Order does not operate any blockchain, server or external infrastructure on which the application depends, and hence The Stable Order is not responsible for their operation.
          </p>

          <p className="leading-relaxed font-semibold text-gray-900 dark:text-white">
            We will never ask for your password, recovery phrase or private keys. Anyone asking this information from you is almost certainly a scammer.
          </p>

          <p className="leading-relaxed text-sm">
            We do not provide support of any kind. We do research and development. Uses of the algorithms, protocols,
            smart contracts, websites and applications that result from our research and development are at your own risk.
          </p>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded border border-gray-300 dark:border-gray-600">
            <p className="leading-relaxed font-medium text-gray-900 dark:text-white">
              By using this application, you confirm that you understand and agree with everything stated above and with our detailed{" "}
              <Link
                href="https://terms.stability.nexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 underline font-semibold"
              >
                Terms and Conditions
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
