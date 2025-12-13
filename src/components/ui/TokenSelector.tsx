"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TokenImage from "@/components/ui/TokenImage";
import type { Token } from "@/utils/tokenList";
import { searchTokens } from "@/utils/tokenList";

interface TokenSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
  selectedAddress?: string;
}

const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({
  isOpen,
  onClose,
  tokens,
  onSelectToken,
  selectedAddress,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    return searchTokens(tokens, searchQuery);
  }, [tokens, searchQuery]);

  const handleTokenSelect = (token: Token) => {
    onSelectToken(token);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-white dark:bg-gray-800 max-w-md max-h-[80vh] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Coins className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Token
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tokens"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">No tokens found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTokens.map((token) => (
                <button
                  type="button"
                  key={token.contract_address}
                  onClick={() => handleTokenSelect(token)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedAddress?.toLowerCase() === token.contract_address.toLowerCase()
                      ? "bg-gray-100 dark:bg-gray-700 ring-2 ring-black dark:ring-white"
                      : ""
                  }`}
                >
                  {/* Token Logo */}
                  <TokenImage
                    src={token.image}
                    alt={token.name}
                    symbol={token.symbol}
                    size="md"
                  />

                  {/* Token Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {token.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                        {token.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                      {token.contract_address.substring(0, 6)}...{token.contract_address.substring(38)}
                    </div>
                  </div>

                  {/* Checkmark for selected token */}
                  {selectedAddress?.toLowerCase() === token.contract_address.toLowerCase() && (
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer with token count */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {filteredTokens.length} token{filteredTokens.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelectorModal;
