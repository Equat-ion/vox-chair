"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  className?: string;
}

export function InputField({
  label,
  error,
  description,
  className = "",
  id,
  ...props
}: InputFieldProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-") || Math.random().toString(36).slice(2);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
      )}
      <Input
        id={inputId}
        {...props}
        className={`${props.className || ""} ${error ? "border-red-500" : ""}`}
      />
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}