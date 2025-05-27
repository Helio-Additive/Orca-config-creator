import { useHookstate } from "@hookstate/core";
import { appState, appStateObject, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { useEffect, useRef } from "react";
import {
  ConfigLocationType,
  ConfigType,
  matchesQuery,
} from "../../lib/commons";
import { ConfigAnalysisMessage } from "../../lib/bindings/ConfigAnalysisMessage";

export default function AnalysisTab() {
  const { analysisResults } = useHookstate(globalState);

  return (
    <div className="h-full overflow-y-auto">
      {analysisResults.map((analysisMessage, index) => {
        return (
          <ConfigItem
            key={index}
            name={analysisMessage.message.get()}
            text1={analysisMessage.config_details.config_type.get()}
            text2={[
              analysisMessage.config_details.name.get(),
              analysisMessage.config_details.location.get(),
            ]}
            fileName={analysisMessage.config_details.file.get()}
            family={analysisMessage.config_details.family.get() ?? undefined}
            type={
              analysisMessage.config_details.config_type.get() as ConfigType
            }
            configLocation={
              analysisMessage.config_details.location.get() as ConfigLocationType
            }
          />
        );
      })}
    </div>
  );
}
