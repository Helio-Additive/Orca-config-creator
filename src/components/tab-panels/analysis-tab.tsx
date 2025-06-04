import { useHookstate } from "@hookstate/core";
import {
  ConfigLocationType,
  ConfigType,
  matchesQuery,
} from "../../lib/commons";
import { appState, appStateObject, globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";
import { useEffect, useRef } from "react";

export default function AnalysisTab() {
  const { analysisErrors, analysisWarnings } = useHookstate(globalState);

  const {
    itemVisibilityState: { analyzed: itemVisibility },
    searchQuery,
  } = useHookstate(appState);

  const currentIndexes = useRef({ errors: 0, warnings: 0 });

  useEffect(() => {
    return () => {
      itemVisibility.errors.set(
        appStateObject.itemVisibilityState.analyzed.errors
      );
      itemVisibility.warnings.set(
        appStateObject.itemVisibilityState.analyzed.warnings
      );
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
        Errors
      </div>
      <div className="flex-1/2 min-h-0 overflow-y-auto">
        {Object.entries(analysisErrors.get()).flatMap(
          ([fileName, messages], outerIndex) => {
            if (outerIndex === 0) currentIndexes.current.errors = 0;
            return Object.entries(messages).flatMap(
              ([fieldName, messageDetailsList]) => {
                return messageDetailsList.map((messageDetails, index) => {
                  if (
                    currentIndexes.current.errors >
                      itemVisibility.errors.get() ||
                    !matchesQuery(searchQuery.get(), [
                      fileName,
                      fieldName,
                      messageDetails.config_details.family ?? "",
                      messageDetails.config_details.location,
                      messageDetails.message.text,
                      messageDetails.config_details.config_type,
                    ])
                  )
                    return <div key={fileName + fieldName + index}></div>;

                  currentIndexes.current.errors += 1;

                  return (
                    <ConfigItem
                      key={fileName + fieldName + index}
                      name={messageDetails.config_details.name}
                      text1={messageDetails.config_details.config_type}
                      text2={[
                        messageDetails.config_details.family ?? "",
                        messageDetails.config_details.location,
                        messageDetails.message.text,
                      ]}
                      fileName={messageDetails.config_details.file}
                      family={messageDetails.config_details.family ?? undefined}
                      type={
                        messageDetails.config_details.config_type as ConfigType
                      }
                      configLocation={
                        messageDetails.config_details
                          .location as ConfigLocationType
                      }
                      className="max-w-[fit] w-fit"
                      index={currentIndexes.current.errors}
                      itemVisibilityNumberState={itemVisibility.errors}
                      allowEdit
                    />
                  );
                });
              }
            );
          }
        )}
      </div>

      <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
        Warnings
      </div>
      <div className="flex-1/2 shrink-1 basis-1/2 min-h-0 overflow-y-auto">
        {Object.entries(analysisWarnings.get()).flatMap(
          ([fileName, messages], outerIndex) => {
            if (outerIndex === 0) currentIndexes.current.errors = 0;
            return Object.entries(messages).flatMap(
              ([fieldName, messageDetailsList]) => {
                return messageDetailsList.map((messageDetails, index) => {
                  if (
                    currentIndexes.current.errors >
                      itemVisibility.errors.get() ||
                    !matchesQuery(searchQuery.get(), [
                      fileName,
                      fieldName,
                      messageDetails.config_details.family ?? "",
                      messageDetails.config_details.location,
                      messageDetails.message.text,
                      messageDetails.config_details.config_type,
                    ])
                  )
                    return <div key={fileName + fieldName + index}></div>;

                  currentIndexes.current.errors += 1;

                  return (
                    <ConfigItem
                      key={fileName + fieldName + index}
                      name={messageDetails.config_details.name}
                      text1={messageDetails.config_details.config_type}
                      text2={[
                        messageDetails.config_details.location,
                        messageDetails.message.text,
                      ]}
                      fileName={messageDetails.config_details.file}
                      family={messageDetails.config_details.family ?? undefined}
                      type={
                        messageDetails.config_details.config_type as ConfigType
                      }
                      configLocation={
                        messageDetails.config_details
                          .location as ConfigLocationType
                      }
                      className="max-w-[fit] w-fit"
                      index={currentIndexes.current.errors}
                      itemVisibilityNumberState={itemVisibility.errors}
                      allowEdit
                    />
                  );
                });
              }
            );
          }
        )}
      </div>
    </div>
  );
}
