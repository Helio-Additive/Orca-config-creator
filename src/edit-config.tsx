import { none, useHookstate } from "@hookstate/core";
import { useEffect, useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import { deinherit_config_by_type } from "./lib/commons";
import { globalState } from "./lib/state-store";
import InputComponent from "./components/tab-panels/input-component";

export default function EditConfig() {
  const [hasLoaded, setHasLoaded] = useState(false);

  const [searchParams] = useSearchParams();
  const fileName: string = searchParams.get("fileName")!;
  const navigate = useNavigate();

  const { editWindowState } = useHookstate(globalState);

  useEffect(() => {
    deinherit_config_by_type(
      editWindowState[fileName].name.get({ stealth: true }),
      editWindowState[fileName].type.get({ stealth: true })
    ).then((res) => {
      editWindowState[fileName].properties.set(res);
      setHasLoaded(true);
    });
  }, []);

  useEffect(() => {
    console.log(editWindowState[fileName].get());
  }, [editWindowState[fileName]]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex rounded-xl bg-transparent-base backdrop-blur-xs max-w-fit">
        <div
          className={`flex items-center aspect-square 
            bg-background hover:bg-transparent-black-hover 
            m-1 p-1 rounded-xl`}
          onClick={() => navigate(-1)}
        >
          <IoMdArrowRoundBack className="text-2xl text-text-primary" />
        </div>
        <div
          className={`py-0.5 pb-1.5 px-6 text-2xl m-1
                    font-semibold text-text-secondary`}
        >
          {editWindowState[fileName].name.get()}
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-1 rounded-xl bg-transparent-base p-3 backdrop-blur-xs overflow-y-auto">
        {editWindowState[fileName].properties.res.keys.map((key) => {
          const property = editWindowState[fileName].properties.res[key].get();
          const keyDetails =
            editWindowState[fileName].properties.keyDetails[key].get();

          return (
            <InputComponent
              key={key}
              label={key}
              value={property as string}
              extraLabel={keyDetails[0] + " · " + keyDetails[1]}
              labelClassName="text-lg"
            ></InputComponent>
          );
        })}
      </div>
    </div>
  );
}
