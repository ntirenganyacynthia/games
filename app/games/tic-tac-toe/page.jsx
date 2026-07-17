"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateWinner, emptyBoard, isDraw, makeMove, nextPlayer } from "./logic";

function Square({ value, onClick, highlight, disabled }) {
  return (
    <button
      type="button"
      aria-label={value ? `Square with ${value}` : "Empty square"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex size-20 items-center justify-center rounded-md border text-4xl font-bold transition-colors",
        "hover:bg-accent disabled:cursor-not-allowed disabled:hover:bg-transparent",
        highlight && "bg-emerald-100 dark:bg-emerald-950",
        value === "X" && "text-sky-600 dark:text-sky-400",
        value === "O" && "text-rose-600 dark:text-rose-400",
      )}
    >
      {value}
    </button>
  );
}

export default function TicTacToePage() {
  const [board, setBoard] = useState(emptyBoard);
  const [player, setPlayer] = useState("X");

  const result = calculateWinner(board);
  const draw = isDraw(board);
  const gameOver = Boolean(result) || draw;

  const status = result ? `Winner: ${result.winner}` : draw ? "It's a draw!" : `Turn: ${player}`;

  function handleClick(index) {
    const next = makeMove(board, index, player);
    if (next === board) return; 
    setBoard(next);
    setPlayer((p) => nextPlayer(p));
  }

  function reset() {
    setBoard(emptyBoard());
    setPlayer("X");
  }

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Tic-Tac-Toe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p aria-live="polite" className="text-center text-lg font-medium" data-testid="status">
            {status}
          </p>

          <div className="mx-auto grid w-fit grid-cols-3 gap-2">
            {board.map((value, index) => (
              <Square
                key={index}
                value={value}
                onClick={() => handleClick(index)}
                disabled={gameOver || Boolean(value)}
                highlight={result?.line.includes(index)}
              />
            ))}
          </div>

          <div className="flex justify-center">
            <Button onClick={reset} variant="outline">
              New game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
