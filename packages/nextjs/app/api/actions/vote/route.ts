import { ActionGetResponse, ActionPostResponse } from "@solana/actions";
import { parseEther } from "viem";
import { serialize } from "wagmi";

// CAIP-2 format for Monad Testnet
const blockchain = `eip155:10143`;

// 接收投票费用的钱包地址
const voteReceiverWallet = `0x8170Dde13D14E93Af7EDEdcE81db35479630cB8B`;

// Create headers with CAIP blockchain ID
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-blockchain-ids, x-action-version",
  "Content-Type": "application/json",
  "x-blockchain-ids": blockchain,
  "x-action-version": "2.0",
};

// OPTIONS endpoint is required for CORS preflight requests
export const OPTIONS = async () => {
  return new Response(null, { headers });
};

// GET endpoint returns the Blink metadata (JSON) and UI configuration
export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const memeId = url.searchParams.get("memeId");
  const voteType = url.searchParams.get("type"); // "like" or "dislike"

  // This JSON is used to render the Blink UI
  const response: ActionGetResponse = {
    type: "action",
    icon: `${new URL("/logo.svg", req.url).toString()}`,
    label: `${voteType === "like" ? "👍 Like" : "👎 Dislike"} (0.001 MON)`,
    title: "Vote for Meme",
    description: `Vote ${voteType === "like" ? "👍 Like" : "👎 Dislike"} for this meme. Cost: 0.001 MON`,
    // Links is used if you have multiple actions or if you need more than one params
    links: {
      actions: [
        {
          // Defines this as a blockchain transaction
          type: "transaction",
          label: `${voteType === "like" ? "👍 Like" : "👎 Dislike"} (0.001 MON)`,
          // This is the endpoint for the POST request
          href: `/api/actions/vote?memeId=${memeId}&type=${voteType}`,
        },
      ],
    },
  };

  // Return the response with proper headers
  return new Response(JSON.stringify(response), {
    status: 200,
    headers,
  });
};

// POST endpoint handles the actual transaction creation
export const POST = async (req: Request) => {
  try {
    // Extract memeId and vote type from URL
    const url = new URL(req.url);
    const memeId = url.searchParams.get("memeId");
    const voteType = url.searchParams.get("type");

    if (!memeId || !voteType) {
      throw new Error("MemeId and vote type are required");
    }

    // Build the transaction for 0.001 MON payment
    const transaction = {
      to: voteReceiverWallet,
      value: parseEther("0.001").toString(), // 0.001 MON
      chainId: 10143, // Monad Testnet
      data: "0x", // Empty data for simple transfer
    };

    const transactionJson = serialize(transaction);

    // Build ActionPostResponse
    const response: ActionPostResponse = {
      type: "transaction",
      transaction: transactionJson,
      message: `Vote ${voteType === "like" ? "👍 Like" : "👎 Dislike"} for Meme #${memeId} - 0.001 MON`,
    };

    // Return the response with proper headers
    return new Response(JSON.stringify(response), {
      status: 200,
      headers,
    });
  } catch (error) {
    // Log and return an error response
    console.error("Error processing vote request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers,
    });
  }
};
