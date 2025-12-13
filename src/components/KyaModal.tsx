"use client";

import type { FC } from "react";

type KyaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUnderstand: () => void;
};

const KyaModal: FC<KyaModalProps> = ({ isOpen, onClose, onUnderstand }) => {
  if (!isOpen) return null;

  const handleUnderstand = () => {
    localStorage.setItem("kya_seen_v1", "1");
    onUnderstand();
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Know Your Assumptions</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          <p>
            This decentralized application is composed of smart contracts running on a blockchain
            and a website that eases your interaction with the smart contracts.
          </p>

          <p>
            The smart contracts and the website were developed by The Stable Order, an organization
            dedicated to making the world more stable.
          </p>

          <p>
            The source code of the smart contracts and of the website can be found in{" "}
            <a
              href="https://github.com/StabilityNexus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
            >
              https://github.com/StabilityNexus
            </a>
            . We strongly recommend that you do your own research and inspect the source code of
            any blockchain application that you wish to interact with. The source code is the only
            source of truth about the applications that you use.
          </p>

          <p className="font-semibold text-gray-900 dark:text-white">Please note:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                When you interact with any smart contract on any blockchain through any application,
                your transactions are recorded anonymously forever on the blockchain.
              </strong>
              <ul className="list-circle pl-6 mt-1">
                <li>
                  Transactions are final and irreversible once they are confirmed on the blockchain.
                </li>
              </ul>
            </li>
            <li>
              <strong>
                The smart contracts made by The Stable Order are immutable and autonomous.
              </strong>
              <ul className="list-circle pl-6 mt-1">
                <li>
                  No one can change or update the smart contracts deployed on the blockchain.
                </li>
                <li>
                  The smart contracts are executed autonomously by the blockchain&apos;s block validators.
                </li>
              </ul>
            </li>
            <li>
              <strong>
                The websites made by The Stable Order are lean static serverless frontends.
              </strong>
              <ul className="list-circle pl-6 mt-1">
                <li>They do not collect your data on any server.</li>
                <li>
                  They rely solely on data available publicly on blockchains or on data stored
                  locally in your own device.
                </li>
                <li>
                  You may run the websites locally in your own computer. So, even if, for any
                  reason, the websites deployed in our own domains become unavailable, you can still
                  interact with the smart contracts.
                </li>
              </ul>
            </li>
            <li>
              Some of our projects may depend on external infrastructure, such as oracles and
              blockchain explorers.
            </li>
          </ul>

          <p>
            Interacting with blockchain applications may involve risks such as the following
            (non-exhaustively):
          </p>

          <ul className="list-disc pl-6 space-y-2">
            <li>
              You may lose your wallet password, recovery phrases or private keys, thereby losing
              access to your assets.
            </li>
            <li>
              Hackers may succeed in obtaining your wallet password, recovery phrases or private
              keys, thereby gaining access to your assets.
            </li>
            <li>
              The blockchain may become congested or unavailable, resulting in delays in the
              confirmation of your transactions.
            </li>
            <li>
              If you are interacting with a centralized blockchain (a.k.a. &quot;L2&quot;, &quot;sidechain&quot;,
              &quot;Proof-of-Authority blockchain&quot;, ...), the block validators may decide to stop
              operating the blockchain.
            </li>
            <li>
              The external infrastructure on which a decentralized application depends may
              experience issues or become unavailable.
              <ul className="list-circle pl-6 mt-1">
                <li>Oracles, in particular, may suffer delays or manipulations.</li>
              </ul>
            </li>
            <li>
              The source code of the smart contracts and the website may contain bugs that may cause
              the application to behave unexpectedly and unfavourably.
            </li>
            <li>
              The algorithms and protocols implemented by the code may have unforeseen behaviors.
            </li>
          </ul>

          <p>
            While we do our best to ensure that we implement good algorithms and protocols, that the
            implementations are free from bugs, and that the deployed applications are fully or
            minimally dependent on external infrastructure, you use the applications at your own
            risk. You are solely responsible for your assets. You are solely responsible for the
            security of your wallet (and its password, recovery phrase and private keys). The Stable
            Order does not operate any blockchain, server or external infrastructure on which the
            application depends, and hence The Stable Order is not responsible for their operation.
          </p>

          <p>
            We will never ask for your password, recovery phrase or private keys. Anyone asking this
            information from you is almost certainly a scammer.
          </p>

          <p>
            We do not provide support of any kind. We do research and development. Uses of the
            algorithms, protocols, smart contracts, websites and applications that result from our
            research and development are at your own risk.
          </p>

          <p>
            By using this application, you confirm that you understand and agree with everything
            stated above and with our detailed{" "}
            <a
              href="https://terms.stability.nexus"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
            >
              Terms and Conditions
            </a>
            .
          </p>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleUnderstand}
              className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black hover:bg-neutral-700 dark:hover:bg-neutral-200 rounded-md transition-colors font-medium"
            >
              I understand and I agree.
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KyaModal;

