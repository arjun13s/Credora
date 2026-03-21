"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

interface PlaidLinkProps {
  onSuccess: (publicToken: string) => void;
  disabled?: boolean;
}

export function PlaidLink({ onSuccess, disabled }: PlaidLinkProps) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const createToken = async () => {
      try {
        const response = await fetch("/api/plaid/create-link-token", {
          method: "POST",
        });
        const data = await response.json();
        if (data.link_token) {
          setToken(data.link_token);
        } else {
          console.error("Failed to fetch Plaid link_token:", data.error);
        }
      } catch (error) {
        console.error("Error creating Plaid link token:", error);
      }
    };
    createToken();
  }, []);

  const handleSuccess = useCallback(
    (publicToken: string) => {
      onSuccess(publicToken);
    },
    [onSuccess],
  );

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: handleSuccess,
  });

  return (
    <button
      className="button button--secondary"
      disabled={!ready || disabled}
      onClick={() => open()}
      type="button"
    >
      Connect bank via Plaid
    </button>
  );
}
