import { useHookstate } from "@hookstate/core";
import { ConfigLocationType, ConfigType } from "../../lib/commons";
import { globalState } from "../../lib/state-store";
import ConfigItem from "./config-list/config-item";

export default function AnalysisTab() {
  const { analysisErrors, analysisWarnings } = useHookstate(globalState);

  return (
    <div className="h-full overflow-y-auto">
      <div className="font-semibold text-text-primary text-2xl mb-3 pl-3">
        Errors
      </div>
      <div className="min-h-0 overflow-y-auto">
        {Object.entries(analysisErrors.get()).flatMap(
          ([fileName, messages]) => {
            return Object.entries(messages).flatMap(
              ([fieldName, messageDetailsList]) => {
                return messageDetailsList.map((messageDetails, index) => {
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
      <div className="flex-1 shrink-1 basis-1/2 min-h-0 overflow-y-auto">
        {Object.entries(analysisWarnings.get()).flatMap(
          ([fileName, messages]) => {
            return Object.entries(messages).flatMap(
              ([fieldName, messageDetailsList]) => {
                return messageDetailsList.map((messageDetails, index) => {
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
