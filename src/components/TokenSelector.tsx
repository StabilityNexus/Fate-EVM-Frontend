"use client";

import { useState, useEffect, useMemo } from "react";
import { useChainId } from "wagmi";
import { getChainNameForTokenList } from "@/utils/chainMapping";
import { Input } from "@/components/ui/input";

export interface Token {
  id: string;
  symbol: string;
  name: string;
  contract_address: string;
  image?: string;
}

interface TokenSelectorProps {
  value?: string;
  onChange: (address: string) => void;
  error?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  value = "",
  onChange,
  error,
  placeholder = "Enter ERC20 token address or select from list",
  label = "Token Address",
  required = false,
}) => {
  const chainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState(value);

  // Sync manualAddress with value prop
  useEffect(() => {
    if (value) {
      setManualAddress(value);
      // Check if value matches any token in the list
      const matchingToken = tokens.find(
        (token) => token.contract_address.toLowerCase() === value.toLowerCase()
      );
      if (!matchingToken) {
        setIsManualInput(true);
      }
    }
  }, [value, tokens]);

  // Get chain name for token list URL
  const chainName = useMemo(() => getChainNameForTokenList(chainId), [chainId]);

  // Fetch tokens from TokenList repository
  useEffect(() => {
    const fetchTokens = async () => {
      if (!chainName) {
        console.warn(`No token list available for chain ID ${chainId}`);
        return;
      }

      setLoading(true);
      try {
        const url = `https://raw.githubusercontent.com/StabilityNexus/TokenList/main/${chainName}-tokens.json`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.statusText}`);
        }
        const data = await response.json();
        // Handle both array and object formats
        const tokenArray = Array.isArray(data) ? data : Object.values(data);
        setTokens(tokenArray as Token[]);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [chainName, chainId]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;

    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.contract_address.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    onChange(token.contract_address);
    setManualAddress(token.contract_address);
    setIsManualInput(false);
    setIsModalOpen(false);
    setSearchQuery("");
  };

  // Handle manual input change
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setManualAddress(address);
    onChange(address);
    setIsManualInput(true);
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get selected token info for display
  const selectedToken = useMemo(() => {
    if (!value || isManualInput) return null;
    return tokens.find(
      (token) => token.contract_address.toLowerCase() === value.toLowerCase()
    );
  }, [value, tokens, isManualInput]);

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          {selectedToken && !isManualInput ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={`w-full p-2.5 text-sm outline-none border rounded-md transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white hover:border-gray-300 dark:hover:border-gray-600 flex items-center gap-2 ${
                error ? "border-red-500" : ""
              }`}
            >
              <img
                src={selectedToken.image || "/file.svg"}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/file.svg";
                }}
              />
              <span className="font-medium">{selectedToken.symbol}</span>
              <span className="text-gray-500 dark:text-gray-400">({selectedToken.name})</span>
              <span className="text-gray-400 dark:text-gray-500 ml-auto font-mono text-xs">
                {truncateAddress(selectedToken.contract_address)}
              </span>
            </button>
          ) : (
            <Input
              type="text"
              value={manualAddress}
              onChange={handleManualInputChange}
              placeholder={placeholder}
              className={`transition-all focus:ring-2 focus:ring-black dark:focus:ring-white border-gray-200 dark:border-gray-700 text-black dark:text-white ${
                error ? "border-red-500" : ""
              }`}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white rounded-md border border-gray-300 dark:border-gray-600 transition-colors text-sm whitespace-nowrap font-medium"
        >
          {selectedToken && !isManualInput ? "Change" : "Select Token"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Token Selection Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[1000] p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Token</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens"
                  className="w-full pl-10 border-gray-200 dark:border-gray-700 text-black dark:text-white bg-white dark:bg-gray-800"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading tokens...
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? "No tokens found matching your search"
                    : "No tokens available for this chain"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleTokenSelect(token)}
                      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <img
                        src={token.image || "/file.svg"}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/file.svg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {token.symbol}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm truncate">
                            {token.name}
                          </span>
                        </div>
                        <div className="text-gray-400 dark:text-gray-500 text-xs font-mono mt-1">
                          {truncateAddress(token.contract_address)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Input Option */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setIsManualInput(true);
                  setIsModalOpen(false);
                }}
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-colors text-sm font-medium"
              >
                Enter Custom Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;


