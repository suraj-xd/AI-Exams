"use client";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-textarea/styles.css"; // also import this if you want to use the CopilotTextarea component

export default function RootLayout({children}) {
  return (
    <CopilotKit url="/path_to_copilotkit_endpoint/see_below">
      {children}
    </CopilotKit>
  );
}

import { CopilotTextarea } from "@copilotkit/react-textarea";
import { useState } from "react";

export function SomeReactComponent() {
  const [text, setText] = useState("");

  return (
    <>
      <CopilotTextarea
        className="px-4 py-4"
        value={text}
        onValueChange={(value: string) => setText(value)}
        placeholder="What are your plans for your vacation?"
        autosuggestionsConfig={{
          textareaPurpose: "Travel notes from the user's previous vacations. Likely written in a colloquial style, but adjust as needed.",
          chatApiConfigs: {
            suggestionsApiConfig: {
              forwardedParams: {
                max_tokens: 20,
                stop: [".", "?", "!"],
              },
            },
          },
        }}
      />
    </>
  );
}
