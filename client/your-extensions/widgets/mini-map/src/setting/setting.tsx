import { React } from "jimu-core";
import { AllWidgetSettingProps } from "jimu-for-builder";
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components"; //  allows the author to choose which map widget to use

/**
 * In ArcGIS Experience Builder, there can be more than one Map Widget on the page at a time.
 * Because of this, a custom widget must have a section of its Settings Panel that allows the author
 *  to choose which map widget to use.
 * @param props 
 * @returns 
 */
const Setting = (props: AllWidgetSettingProps<any>) => {

    const onMapWidgetSelected = (useMapWidgetIds: string[]) => {
        props.onSettingChange({
          id: props.id,
          useMapWidgetIds: useMapWidgetIds
        });
    };

    return (
        <div className="widget-setting-demo">
          <MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={onMapWidgetSelected} />
        </div>
    );

  };
  
  export default Setting;