import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
export declare class Visual implements IVisual {
    private target;
    private host;
    private svg;
    private container;
    private settings;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    private updateSettings;
    private processData;
    private drawBoxPlots;
    private drawMeanSymbol;
    private showTooltip;
    private hideTooltip;
    private displayMessage;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration;
}
