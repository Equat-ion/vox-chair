"use client";

import { useEffect, useRef } from "react";
import { Editor, rootCtx, defaultValueCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { placeholder, placeholderCtx } from "milkdown-plugin-placeholder";

interface MilkdownEditorProps {
  defaultValue?: string;
  onChange?: (markdown: string) => void;
}

export function MilkdownEditor({ defaultValue = "", onChange }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const isCreatingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current || editorInstanceRef.current || isCreatingRef.current) {
      return;
    }

    isCreatingRef.current = true;

    const editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, editorRef.current);
        ctx.set(defaultValueCtx, defaultValue);
        ctx.set(placeholderCtx, "Start writing your content here...");

        if (onChange) {
          ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
            onChange(markdown);
          });
        }
      })
      .use(commonmark)
      .use(listener)
      .use(placeholder);

    editor.create().then(() => {
      editorInstanceRef.current = editor;
    }).catch((error) => {
      console.error("Failed to create editor:", error);
      isCreatingRef.current = false;
    });

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
      isCreatingRef.current = false;
    };
  }, []);

  return (
    <div className="milkdown-editor-wrapper relative">
      <div ref={editorRef} className="milkdown milkdown-editor" />
    </div>
  );
}
