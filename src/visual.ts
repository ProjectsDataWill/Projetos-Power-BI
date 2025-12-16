"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import * as d3 from "d3";

export class Visual implements IVisual {
    private target: HTMLElement;
    private host: IVisualHost;
    private svg: d3.Selection<SVGSVGElement, any, any, any>;
    private container: d3.Selection<SVGGElement, any, any, any>;
    private settings: BoxPlotSettings;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        
        this.svg = d3.select(this.target)
            .append('svg')
            .classed('boxPlotSVG', true);
            
        this.container = this.svg.append('g')
            .classed('container', true);
            
        this.settings = {
            whiskerType: "1.5IQR",
            showOutliers: true,
            showDataPoints: true,
            dataPointSize: 3,
            dataPointOpacity: 0.4,
            boxColor: "#4472C4",
            boxBorderWidth: 2,
            boxBorderColor: "#2a4a7c",
            medianColor: "#FF0000",
            meanColor: "#00DD00",
            outlierColor: "#FF6B6B",
            autoRange: false,
            rangeStart: 0,
            rangeEnd: 600,
            focusOnIQR: true,
            clipOutliers: true,
            outlierSize: 5,
            outlierOpacity: 0.7,
            outlierStrokeWidth: 2,
            outlierStrokeColor: "#CC0000",
            // X Axis
            xAxisShow: true,
            xAxisShowTitle: true,
            xAxisSortOrder: "default",
            xAxisLabelColor: "#333333",
            xAxisLabelFontSize: 11,
            xAxisLabelAngle: -45,
            xAxisTitle: "",
            xAxisTitleColor: "#333333",
            xAxisTitleFontSize: 13,
            // Y Axis
            yAxisShow: true,
            yAxisShowTitle: true,
            yAxisLabelColor: "#333333",
            yAxisLabelFontSize: 11,
            yAxisTitle: "",
            yAxisTitleColor: "#333333",
            yAxisTitleFontSize: 13,
            // Grid Settings
            showGrid: true,
            gridColor: "#E0E0E0",
            gridOpacity: 0.3,
            gridStrokeWidth: 1,
            // Mean Settings
            showMean: true,
            meanShape: "circle",
            meanSize: 6,
            meanOpacity: 1,
            meanStrokeWidth: 2,
            meanStrokeColor: "#006600",
            showMeanLabel: true,
            meanLabelFontSize: 8,
            meanLabelColor: "#000000",
            meanLabelBackground: false,
            meanLabelBackgroundColor: "#FFFFFF",
            meanLabelBackgroundOpacity: 0.8
        };
    }

    public update(options: VisualUpdateOptions) {
        try {
            this.container.selectAll("*").remove();
            
            const width = options.viewport.width;
            const height = options.viewport.height;
            
            this.svg.attr("width", width).attr("height", height);
            
            if (!options.dataViews || !options.dataViews[0]) {
                this.displayMessage("Arraste os campos para começar", width, height);
                return;
            }
            
            const dataView: DataView = options.dataViews[0];
            
            // Atualizar settings
            if (dataView.metadata && dataView.metadata.objects) {
                this.updateSettings(dataView.metadata.objects);
            }
            
            if (!dataView.categorical || 
                !dataView.categorical.categories || 
                !dataView.categorical.categories[0] ||
                !dataView.categorical.values || 
                !dataView.categorical.values[0]) {
                this.displayMessage("Arraste: Categoria e Valores", width, height);
                return;
            }
            
            const categories = dataView.categorical.categories[0];
            const values = dataView.categorical.values[0];
            
            const margin = { top: 30, right: 30, bottom: 60, left: 60 };
            const innerWidth = Math.max(width - margin.left - margin.right, 100);
            const innerHeight = Math.max(height - margin.top - margin.bottom, 100);
            
            this.container.attr("transform", `translate(${margin.left},${margin.top})`);
            
            const data = this.processData(dataView.categorical);
            
            if (data.length === 0) {
                this.displayMessage("Nenhum dado válido", width, height);
                return;
            }
            
            // Aplicar ordenação
            let sortedData = [...data];
            if (this.settings.xAxisSortOrder === "ascending") {
                sortedData.sort((a, b) => a.category.localeCompare(b.category));
            } else if (this.settings.xAxisSortOrder === "descending") {
                sortedData.sort((a, b) => b.category.localeCompare(a.category));
            }
            
            const xScale = d3.scaleBand()
                .domain(sortedData.map(d => d.category))
                .range([0, innerWidth])
                .padding(0.3);
            
            // Determinar range do eixo Y
            let yMin, yMax;

            if (this.settings.autoRange) {
                if (this.settings.focusOnIQR) {
                    const nonOutlierValues = sortedData.flatMap(d => 
                        d.values.filter(v => !d.outliers.includes(v))
                    );
                    if (nonOutlierValues.length > 0) {
                        yMin = Math.max(0, d3.min(nonOutlierValues) * 0.95);
                        yMax = d3.max(nonOutlierValues) * 1.05;
                    } else {
                        yMin = 0;
                        yMax = d3.max(sortedData.flatMap(d => d.values)) * 1.1;
                    }
                } else {
                    const allValues = sortedData.flatMap(d => [...d.values, d.min, d.max]);
                    yMin = Math.max(0, d3.min(allValues) * 0.9);
                    yMax = d3.max(allValues) * 1.1;
                }
            } else {
                yMin = this.settings.rangeStart;
                yMax = this.settings.rangeEnd;
            }

            const yScale = d3.scaleLinear()
                .domain([yMin, yMax])
                .range([innerHeight, 0])
                .nice();
            
            // Grade
            if (this.settings.showGrid) {
                const gridGroup = this.container.append("g")
                    .attr("class", "grid")
                    .call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ""));
                
                // Aplicar estilos nas linhas de grade
                gridGroup.selectAll("line")
                    .style("stroke", this.settings.gridColor)
                    .style("stroke-dasharray", "3,3")
                    .style("opacity", this.settings.gridOpacity)
                    .style("stroke-width", this.settings.gridStrokeWidth);
                
                // Remover o path do domínio (linha vertical do eixo)
                gridGroup.select(".domain").remove();
            }
            
            // Eixo X
            if (this.settings.xAxisShow) {
                this.container.append("g")
                    .attr("transform", `translate(0,${innerHeight})`)
                    .call(d3.axisBottom(xScale))
                    .selectAll("text")
                    .attr("transform", `rotate(${this.settings.xAxisLabelAngle})`)
                    .style("text-anchor", this.settings.xAxisLabelAngle < 0 ? "end" : "start")
                    .style("font-size", `${this.settings.xAxisLabelFontSize}px`)
                    .style("font-weight", "500")
                    .style("fill", this.settings.xAxisLabelColor);
            }
            
            // Eixo Y
            if (this.settings.yAxisShow) {
                this.container.append("g")
                    .call(d3.axisLeft(yScale).ticks(8))
                    .style("font-size", `${this.settings.yAxisLabelFontSize}px`)
                    .selectAll("text")
                    .style("fill", this.settings.yAxisLabelColor);
            }
            
            // Título do eixo X
            if (this.settings.xAxisShowTitle) {
                const xTitle = this.settings.xAxisTitle || categories.source.displayName || "Category";
                this.container.append("text")
                    .attr("x", innerWidth/2)
                    .attr("y", innerHeight + 50)
                    .style("text-anchor", "middle")
                    .style("font-size", `${this.settings.xAxisTitleFontSize}px`)
                    .style("font-weight", "bold")
                    .style("fill", this.settings.xAxisTitleColor)
                    .text(xTitle);
            }
            
            // Título do eixo Y
            if (this.settings.yAxisShowTitle) {
                const yTitle = this.settings.yAxisTitle || values.source.displayName || "Values";
                this.container.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -45)
                    .attr("x", -innerHeight/2)
                    .style("text-anchor", "middle")
                    .style("font-size", `${this.settings.yAxisTitleFontSize}px`)
                    .style("font-weight", "bold")
                    .style("fill", this.settings.yAxisTitleColor)
                    .text(yTitle);
            }
            
            this.drawBoxPlots(sortedData, xScale, yScale, innerHeight);
            
        } catch (error) {
            console.error("Erro:", error);
            this.displayMessage("Erro ao processar dados", options.viewport.width, options.viewport.height);
        }
    }
    
    private updateSettings(objects: any) {
        if (objects.boxPlotSettings) {
            if (objects.boxPlotSettings.whiskerType) {
                this.settings.whiskerType = objects.boxPlotSettings.whiskerType.toString();
            }
            if (objects.boxPlotSettings.showOutliers !== undefined) {
                this.settings.showOutliers = objects.boxPlotSettings.showOutliers;
            }
            if (objects.boxPlotSettings.showDataPoints !== undefined) {
                this.settings.showDataPoints = objects.boxPlotSettings.showDataPoints;
            }
            if (objects.boxPlotSettings.dataPointSize) {
                this.settings.dataPointSize = objects.boxPlotSettings.dataPointSize;
            }
            if (objects.boxPlotSettings.dataPointOpacity) {
                this.settings.dataPointOpacity = objects.boxPlotSettings.dataPointOpacity;
            }
            if (objects.boxPlotSettings.boxBorderWidth !== undefined) {
                this.settings.boxBorderWidth = objects.boxPlotSettings.boxBorderWidth;
            }
            if (objects.boxPlotSettings.boxBorderColor) {
                this.settings.boxBorderColor = objects.boxPlotSettings.boxBorderColor.solid.color;
            }
        }
        if (objects.colors) {
            if (objects.colors.boxColor) {
                this.settings.boxColor = objects.colors.boxColor.solid.color;
            }
            if (objects.colors.medianColor) {
                this.settings.medianColor = objects.colors.medianColor.solid.color;
            }
            if (objects.colors.meanColor) {
                this.settings.meanColor = objects.colors.meanColor.solid.color;
            }
            if (objects.colors.outlierColor) {
                this.settings.outlierColor = objects.colors.outlierColor.solid.color;
            }
        }
        if (objects.xAxis) {
            if (objects.xAxis.show !== undefined) {
                this.settings.xAxisShow = objects.xAxis.show;
            }
            if (objects.xAxis.showTitle !== undefined) {
                this.settings.xAxisShowTitle = objects.xAxis.showTitle;
            }
            if (objects.xAxis.sortOrder) {
                this.settings.xAxisSortOrder = objects.xAxis.sortOrder.toString();
            }
            if (objects.xAxis.labelColor) {
                this.settings.xAxisLabelColor = objects.xAxis.labelColor.solid.color;
            }
            if (objects.xAxis.labelFontSize !== undefined) {
                this.settings.xAxisLabelFontSize = objects.xAxis.labelFontSize;
            }
            if (objects.xAxis.labelAngle !== undefined) {
                this.settings.xAxisLabelAngle = objects.xAxis.labelAngle;
            }
            if (objects.xAxis.title !== undefined) {
                this.settings.xAxisTitle = objects.xAxis.title;
            }
            if (objects.xAxis.titleColor) {
                this.settings.xAxisTitleColor = objects.xAxis.titleColor.solid.color;
            }
            if (objects.xAxis.titleFontSize !== undefined) {
                this.settings.xAxisTitleFontSize = objects.xAxis.titleFontSize;
            }
        }
        if (objects.yAxis) {
            if (objects.yAxis.show !== undefined) {
                this.settings.yAxisShow = objects.yAxis.show;
            }
            if (objects.yAxis.showTitle !== undefined) {
                this.settings.yAxisShowTitle = objects.yAxis.showTitle;
            }
            if (objects.yAxis.autoRange !== undefined) {
                this.settings.autoRange = objects.yAxis.autoRange;
            }
            if (objects.yAxis.rangeStart !== undefined) {
                this.settings.rangeStart = objects.yAxis.rangeStart;
            }
            if (objects.yAxis.rangeEnd !== undefined) {
                this.settings.rangeEnd = objects.yAxis.rangeEnd;
            }
            if (objects.yAxis.focusOnIQR !== undefined) {
                this.settings.focusOnIQR = objects.yAxis.focusOnIQR;
            }
            if (objects.yAxis.clipOutliers !== undefined) {
                this.settings.clipOutliers = objects.yAxis.clipOutliers;
            }
            if (objects.yAxis.labelColor) {
                this.settings.yAxisLabelColor = objects.yAxis.labelColor.solid.color;
            }
            if (objects.yAxis.labelFontSize !== undefined) {
                this.settings.yAxisLabelFontSize = objects.yAxis.labelFontSize;
            }
            if (objects.yAxis.title !== undefined) {
                this.settings.yAxisTitle = objects.yAxis.title;
            }
            if (objects.yAxis.titleColor) {
                this.settings.yAxisTitleColor = objects.yAxis.titleColor.solid.color;
            }
            if (objects.yAxis.titleFontSize !== undefined) {
                this.settings.yAxisTitleFontSize = objects.yAxis.titleFontSize;
            }
        }
        if (objects.outlierSettings) {
            if (objects.outlierSettings.outlierSize !== undefined) {
                this.settings.outlierSize = objects.outlierSettings.outlierSize;
            }
            if (objects.outlierSettings.outlierOpacity !== undefined) {
                this.settings.outlierOpacity = objects.outlierSettings.outlierOpacity;
            }
            if (objects.outlierSettings.outlierStrokeWidth !== undefined) {
                this.settings.outlierStrokeWidth = objects.outlierSettings.outlierStrokeWidth;
            }
            if (objects.outlierSettings.outlierStrokeColor) {
                this.settings.outlierStrokeColor = objects.outlierSettings.outlierStrokeColor.solid.color;
            }
        }
        if (objects.gridSettings) {
            if (objects.gridSettings.showGrid !== undefined) {
                this.settings.showGrid = objects.gridSettings.showGrid;
            }
            if (objects.gridSettings.gridColor) {
                this.settings.gridColor = objects.gridSettings.gridColor.solid.color;
            }
            if (objects.gridSettings.gridOpacity !== undefined) {
                this.settings.gridOpacity = objects.gridSettings.gridOpacity;
            }
            if (objects.gridSettings.gridStrokeWidth !== undefined) {
                this.settings.gridStrokeWidth = objects.gridSettings.gridStrokeWidth;
            }
        }
        if (objects.meanSettings) {
            if (objects.meanSettings.showMean !== undefined) {
                this.settings.showMean = objects.meanSettings.showMean;
            }
            if (objects.meanSettings.meanShape) {
                this.settings.meanShape = objects.meanSettings.meanShape.toString();
            }
            if (objects.meanSettings.meanSize !== undefined) {
                this.settings.meanSize = objects.meanSettings.meanSize;
            }
            if (objects.meanSettings.meanOpacity !== undefined) {
                this.settings.meanOpacity = objects.meanSettings.meanOpacity;
            }
            if (objects.meanSettings.meanStrokeWidth !== undefined) {
                this.settings.meanStrokeWidth = objects.meanSettings.meanStrokeWidth;
            }
            if (objects.meanSettings.meanStrokeColor) {
                this.settings.meanStrokeColor = objects.meanSettings.meanStrokeColor.solid.color;
            }
            if (objects.meanSettings.showMeanLabel !== undefined) {
                this.settings.showMeanLabel = objects.meanSettings.showMeanLabel;
            }
            if (objects.meanSettings.meanLabelFontSize !== undefined) {
                this.settings.meanLabelFontSize = objects.meanSettings.meanLabelFontSize;
            }
            if (objects.meanSettings.meanLabelColor) {
                this.settings.meanLabelColor = objects.meanSettings.meanLabelColor.solid.color;
            }
            if (objects.meanSettings.meanLabelBackground !== undefined) {
                this.settings.meanLabelBackground = objects.meanSettings.meanLabelBackground;
            }
            if (objects.meanSettings.meanLabelBackgroundColor) {
                this.settings.meanLabelBackgroundColor = objects.meanSettings.meanLabelBackgroundColor.solid.color;
            }
            if (objects.meanSettings.meanLabelBackgroundOpacity !== undefined) {
                this.settings.meanLabelBackgroundOpacity = objects.meanSettings.meanLabelBackgroundOpacity;
            }
        }
    }
    
    private processData(categorical: any): BoxPlotData[] {
        const dataMap = new Map<string, number[]>();
        
        if (!categorical || !categorical.categories || !categorical.values) {
            return [];
        }
        
        const categories = categorical.categories;
        const values = categorical.values;
        
        const hasDetails = categories.length > 1;
        const mainCategory = categories[0];
        
        if (!mainCategory || !mainCategory.values) {
            return [];
        }
        
        if (!values || values.length === 0 || !values[0] || !values[0].values) {
            return [];
        }
        
        const valueColumn = values[0].values;
        
        for (let i = 0; i < mainCategory.values.length; i++) {
            const category = String(mainCategory.values[i] || "Sem categoria");
            const value = valueColumn[i];
            
            if (value !== null && value !== undefined && !isNaN(value)) {
                if (!dataMap.has(category)) {
                    dataMap.set(category, []);
                }
                dataMap.get(category).push(Number(value));
            }
        }
        
        const result: BoxPlotData[] = [];
        
        dataMap.forEach((vals, cat) => {
            if (vals.length === 0) return;
            
            const sorted = vals.sort((a, b) => a - b);
            
            if (sorted.length < 2) {
                result.push({
                    category: cat,
                    values: vals,
                    min: sorted[0],
                    q1: sorted[0],
                    median: sorted[0],
                    q3: sorted[0],
                    max: sorted[0],
                    mean: sorted[0],
                    outliers: [],
                    count: vals.length
                });
                return;
            }
            
            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);
            const iqr = q3 - q1;
            
            let min, max, lowerBound, upperBound;
            
            if (this.settings.whiskerType === "1.5IQR") {
                lowerBound = q1 - 1.5 * iqr;
                upperBound = q3 + 1.5 * iqr;
                const validMin = sorted.find(v => v >= lowerBound);
                min = validMin !== undefined ? validMin : sorted[0];
                const sortedDesc = [...sorted].reverse();
                const validMax = sortedDesc.find(v => v <= upperBound);
                max = validMax !== undefined ? validMax : sorted[sorted.length - 1];
            } else if (this.settings.whiskerType === "minmax") {
                min = sorted[0];
                max = sorted[sorted.length - 1];
                lowerBound = min;
                upperBound = max;
            } else {
                min = d3.quantile(sorted, 0.05);
                max = d3.quantile(sorted, 0.95);
                lowerBound = min;
                upperBound = max;
            }
            
            const mean = d3.mean(sorted);
            const outliers = sorted.filter(v => v < lowerBound || v > upperBound);
            
            result.push({
                category: cat,
                values: vals,
                min: min,
                q1: q1,
                median: median,
                q3: q3,
                max: max,
                mean: mean,
                outliers: outliers,
                count: vals.length
            });
        });
        
        return result;
    }
    
    private drawBoxPlots(data: BoxPlotData[], xScale: any, yScale: any, height: number) {
        const boxWidth = Math.min(xScale.bandwidth(), 80);
        
        data.forEach(d => {
            const x = xScale(d.category);
            const centerX = x + xScale.bandwidth() / 2;
            
            const boxGroup = this.container.append("g");
            
            const hasVariation = d.q3 > d.q1;
            
            if (this.settings.showDataPoints) {
                const jitterWidth = boxWidth * 0.6;
                
                const valueGroups = new Map<number, number>();
                d.values.forEach(value => {
                    const roundedValue = Math.round(value * 100) / 100;
                    valueGroups.set(roundedValue, (valueGroups.get(roundedValue) || 0) + 1);
                });
                
                const valueCounts = new Map<number, number>();
                
                d.values.forEach(value => {
                    const roundedValue = Math.round(value * 100) / 100;
                    const isOutlier = d.outliers.includes(value);
                    
                    if (!isOutlier || !this.settings.showOutliers) {
                        const count = valueCounts.get(roundedValue) || 0;
                        const total = valueGroups.get(roundedValue);
                        
                        let jitterX;
                        if (total === 1) {
                            jitterX = centerX;
                        } else {
                            const spacing = jitterWidth / (total + 1);
                            jitterX = centerX - jitterWidth/2 + spacing * (count + 1);
                        }
                        
                        valueCounts.set(roundedValue, count + 1);
                        
                        boxGroup.append("circle")
                            .attr("cx", jitterX)
                            .attr("cy", yScale(value))
                            .attr("r", this.settings.dataPointSize)
                            .attr("fill", hasVariation ? "#2E5C8A" : "#FF8C00")
                            .attr("fill-opacity", hasVariation ? this.settings.dataPointOpacity : 0.6)
                            .attr("stroke", hasVariation ? "#1a3a52" : "#CC6600")
                            .attr("stroke-width", 0.8);
                    }
                });
            }
            
            if (!hasVariation) {
                boxGroup.append("line")
                    .attr("x1", centerX - boxWidth/2)
                    .attr("x2", centerX + boxWidth/2)
                    .attr("y1", yScale(d.median))
                    .attr("y2", yScale(d.median))
                    .attr("stroke", "#FF8C00")
                    .attr("stroke-width", 4)
                    .attr("stroke-dasharray", "5,5");
                
                if (this.settings.showMean) {
                    this.drawMeanSymbol(boxGroup, centerX, yScale(d.mean), d.mean);
                }
                
                const invisibleRect = boxGroup.append("rect")
                    .attr("x", centerX - boxWidth/2)
                    .attr("y", yScale(d.median) - 20)
                    .attr("width", boxWidth)
                    .attr("height", 40)
                    .attr("fill", "transparent")
                    .style("cursor", "pointer");
                
                invisibleRect.on("mouseover", (event) => {
                        this.showTooltip(event, d);
                    })
                    .on("mouseout", () => {
                        this.hideTooltip();
                    });
                
                return;
            }
            
            // Whiskers
            boxGroup.append("line")
                .attr("x1", centerX).attr("x2", centerX)
                .attr("y1", yScale(d.min)).attr("y2", yScale(d.q1))
                .attr("stroke", "#333").attr("stroke-width", 2);
            
            boxGroup.append("line")
                .attr("x1", centerX).attr("x2", centerX)
                .attr("y1", yScale(d.q3)).attr("y2", yScale(d.max))
                .attr("stroke", "#333").attr("stroke-width", 2);
            
            // Caps
            const capWidth = boxWidth * 0.4;
            boxGroup.append("line")
                .attr("x1", centerX - capWidth/2).attr("x2", centerX + capWidth/2)
                .attr("y1", yScale(d.min)).attr("y2", yScale(d.min))
                .attr("stroke", "#333").attr("stroke-width", 2);
            
            boxGroup.append("line")
                .attr("x1", centerX - capWidth/2).attr("x2", centerX + capWidth/2)
                .attr("y1", yScale(d.max)).attr("y2", yScale(d.max))
                .attr("stroke", "#333").attr("stroke-width", 2);
            
            // Box
            const boxHeight = Math.abs(yScale(d.q1) - yScale(d.q3));
            const rect = boxGroup.append("rect")
                .attr("x", centerX - boxWidth/2)
                .attr("y", yScale(d.q3))
                .attr("width", boxWidth)
                .attr("height", boxHeight)
                .attr("fill", this.settings.boxColor)
                .attr("fill-opacity", 0.6)
                .attr("stroke", this.settings.boxBorderColor)
                .attr("stroke-width", this.settings.boxBorderWidth)
                .style("cursor", "pointer");
            
            rect.on("mouseover", (event) => {
                    rect.attr("fill-opacity", 0.8);
                    this.showTooltip(event, d);
                })
                .on("mouseout", () => {
                    rect.attr("fill-opacity", 0.6);
                    this.hideTooltip();
                });
            
            // Mediana
            boxGroup.append("line")
                .attr("x1", centerX - boxWidth/2).attr("x2", centerX + boxWidth/2)
                .attr("y1", yScale(d.median)).attr("y2", yScale(d.median))
                .attr("stroke", this.settings.medianColor).attr("stroke-width", 3);
            
            // Média
            if (this.settings.showMean) {
                this.drawMeanSymbol(boxGroup, centerX, yScale(d.mean), d.mean);
            }
            
            // Outliers
            if (this.settings.showOutliers) {
                const outlierGroups = new Map<number, number>();
                d.outliers.forEach(outlier => {
                    const roundedValue = Math.round(outlier * 100) / 100;
                    outlierGroups.set(roundedValue, (outlierGroups.get(roundedValue) || 0) + 1);
                });
                
                const outlierCounts = new Map<number, number>();
                
                d.outliers.forEach(outlier => {
                    const yPos = yScale(outlier);
                    const minY = yScale.range()[1];
                    const maxY = yScale.range()[0];
                    
                    if (this.settings.clipOutliers && (yPos < minY || yPos > maxY)) {
                        return;
                    }
                    
                    const roundedValue = Math.round(outlier * 100) / 100;
                    const count = outlierCounts.get(roundedValue) || 0;
                    const total = outlierGroups.get(roundedValue);
                    
                    let jitterX;
                    if (total === 1) {
                        jitterX = centerX;
                    } else {
                        const spacing = capWidth / (total + 1);
                        jitterX = centerX - capWidth/2 + spacing * (count + 1);
                    }
                    
                    outlierCounts.set(roundedValue, count + 1);
                    
                    boxGroup.append("circle")
                        .attr("cx", jitterX)
                        .attr("cy", Math.max(minY, Math.min(maxY, yPos)))
                        .attr("r", this.settings.outlierSize)
                        .attr("fill", this.settings.outlierColor)
                        .attr("fill-opacity", this.settings.outlierOpacity)
                        .attr("stroke", this.settings.outlierStrokeColor)
                        .attr("stroke-width", this.settings.outlierStrokeWidth);
                });
            }
        });
    }
    
    private drawMeanSymbol(group: any, x: number, y: number, value: number) {
        if (this.settings.meanShape === "circle") {
            group.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", this.settings.meanSize)
                .attr("fill", this.settings.meanColor)
                .attr("fill-opacity", this.settings.meanOpacity)
                .attr("stroke", this.settings.meanStrokeColor)
                .attr("stroke-width", this.settings.meanStrokeWidth);
        } else if (this.settings.meanShape === "square") {
            const size = this.settings.meanSize * 1.6;
            group.append("rect")
                .attr("x", x - size/2)
                .attr("y", y - size/2)
                .attr("width", size)
                .attr("height", size)
                .attr("fill", this.settings.meanColor)
                .attr("fill-opacity", this.settings.meanOpacity)
                .attr("stroke", this.settings.meanStrokeColor)
                .attr("stroke-width", this.settings.meanStrokeWidth);
        } else if (this.settings.meanShape === "diamond") {
            const size = this.settings.meanSize * 1.8;
            const points = `${x},${y-size/2} ${x+size/2},${y} ${x},${y+size/2} ${x-size/2},${y}`;
            group.append("polygon")
                .attr("points", points)
                .attr("fill", this.settings.meanColor)
                .attr("fill-opacity", this.settings.meanOpacity)
                .attr("stroke", this.settings.meanStrokeColor)
                .attr("stroke-width", this.settings.meanStrokeWidth);
        } else if (this.settings.meanShape === "triangle") {
            const size = this.settings.meanSize * 2;
            const points = `${x},${y-size/2} ${x+size/2},${y+size/2} ${x-size/2},${y+size/2}`;
            group.append("polygon")
                .attr("points", points)
                .attr("fill", this.settings.meanColor)
                .attr("fill-opacity", this.settings.meanOpacity)
                .attr("stroke", this.settings.meanStrokeColor)
                .attr("stroke-width", this.settings.meanStrokeWidth);
        } else if (this.settings.meanShape === "cross") {
            const size = this.settings.meanSize * 1.5;
            group.append("line")
                .attr("x1", x - size).attr("x2", x + size)
                .attr("y1", y).attr("y2", y)
                .attr("stroke", this.settings.meanColor)
                .attr("stroke-opacity", this.settings.meanOpacity)
                .attr("stroke-width", this.settings.meanStrokeWidth);
            group.append("line")
                .attr("x1", x).attr("x2", x)
                .attr("y1", y - size).attr("y2", y + size)
                .attr("stroke", this.settings.meanColor)
                .attr("stroke-opacity", this.settings.meanOpacity)
                .attr("stroke-width", this.settings.meanStrokeWidth);
        }
        
        if (this.settings.showMeanLabel) {
            const labelY = y + 20;
            const labelText = value.toFixed(0);
            
            if (this.settings.meanLabelBackground) {
                const textElement = group.append("text")
                    .attr("x", x)
                    .attr("y", labelY)
                    .attr("text-anchor", "middle")
                    .style("font-size", `${this.settings.meanLabelFontSize}px`)
                    .style("font-weight", "bold")
                    .style("pointer-events", "none")
                    .text(labelText);
                
                const bbox = (textElement.node() as any).getBBox();
                const padding = 2;
                
                group.insert("rect", "text")
                    .attr("x", bbox.x - padding)
                    .attr("y", bbox.y - padding)
                    .attr("width", bbox.width + padding * 2)
                    .attr("height", bbox.height + padding * 2)
                    .attr("fill", this.settings.meanLabelBackgroundColor)
                    .attr("fill-opacity", this.settings.meanLabelBackgroundOpacity)
                    .attr("rx", 2)
                    .attr("ry", 2);
                
                textElement.attr("fill", this.settings.meanLabelColor);
            } else {
                group.append("text")
                    .attr("x", x)
                    .attr("y", labelY)
                    .attr("text-anchor", "middle")
                    .style("font-size", `${this.settings.meanLabelFontSize}px`)
                    .style("font-weight", "bold")
                    .style("fill", this.settings.meanLabelColor)
                    .style("pointer-events", "none")
                    .text(labelText);
            }
        }
    }
    
    private showTooltip(event: MouseEvent, data: BoxPlotData) {
        const tooltipData: VisualTooltipDataItem[] = [
            { displayName: "Category", value: data.category },
            { displayName: "Quartile Calculation", value: "Inclusive" },
            { displayName: "Whisker Type", value: this.settings.whiskerType },
            { displayName: "# Samples", value: data.count.toString() },
            { displayName: "Sampling", value: "Documento" },
            { displayName: "Maximum", value: data.max.toFixed(2) },
            { displayName: "Quartile 3", value: data.q3.toFixed(2) },
            { displayName: "Median", value: data.median.toFixed(2) },
            { displayName: "Average", value: data.mean.toFixed(2) },
            { displayName: "Quartile 1", value: data.q1.toFixed(2) },
            { displayName: "Minimum", value: data.min.toFixed(2) }
        ];
        
        if (data.outliers.length > 0) {
            tooltipData.push({ displayName: "Outliers", value: data.outliers.length.toString() });
        }
        
        this.host.tooltipService.show({
            dataItems: tooltipData,
            identities: [],
            coordinates: [event.clientX, event.clientY],
            isTouchEvent: false
        });
    }
    
    private hideTooltip() {
        this.host.tooltipService.hide({
            immediately: true,
            isTouchEvent: false
        });
    }
    
    private displayMessage(message: string, width: number, height: number) {
        this.container.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#666")
            .text(message);
    }
    
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
        const instances: VisualObjectInstance[] = [];
        
        switch (options.objectName) {
            case "xAxis":
                instances.push({
                    objectName: "xAxis",
                    properties: {
                        show: this.settings.xAxisShow,
                        showTitle: this.settings.xAxisShowTitle,
                        sortOrder: this.settings.xAxisSortOrder,
                        labelColor: { solid: { color: this.settings.xAxisLabelColor } },
                        labelFontSize: this.settings.xAxisLabelFontSize,
                        labelAngle: this.settings.xAxisLabelAngle,
                        title: this.settings.xAxisTitle,
                        titleColor: { solid: { color: this.settings.xAxisTitleColor } },
                        titleFontSize: this.settings.xAxisTitleFontSize
                    },
                    selector: null
                });
                break;
            case "yAxis":
                instances.push({
                    objectName: "yAxis",
                    properties: {
                        show: this.settings.yAxisShow,
                        showTitle: this.settings.yAxisShowTitle,
                        autoRange: this.settings.autoRange,
                        rangeStart: this.settings.rangeStart,
                        rangeEnd: this.settings.rangeEnd,
                        focusOnIQR: this.settings.focusOnIQR,
                        clipOutliers: this.settings.clipOutliers,
                        labelColor: { solid: { color: this.settings.yAxisLabelColor } },
                        labelFontSize: this.settings.yAxisLabelFontSize,
                        title: this.settings.yAxisTitle,
                        titleColor: { solid: { color: this.settings.yAxisTitleColor } },
                        titleFontSize: this.settings.yAxisTitleFontSize
                    },
                    selector: null
                });
                break;
            case "boxPlotSettings":
                instances.push({
                    objectName: "boxPlotSettings",
                    properties: {
                        whiskerType: this.settings.whiskerType,
                        showOutliers: this.settings.showOutliers,
                        showDataPoints: this.settings.showDataPoints,
                        dataPointSize: this.settings.dataPointSize,
                        dataPointOpacity: this.settings.dataPointOpacity,
                        boxBorderWidth: this.settings.boxBorderWidth,
                        boxBorderColor: { solid: { color: this.settings.boxBorderColor } }
                    },
                    selector: null
                });
                break;
            case "gridSettings":
                instances.push({
                    objectName: "gridSettings",
                    properties: {
                        showGrid: this.settings.showGrid,
                        gridColor: { solid: { color: this.settings.gridColor } },
                        gridOpacity: this.settings.gridOpacity,
                        gridStrokeWidth: this.settings.gridStrokeWidth
                    },
                    selector: null
                });
                break;
            case "outlierSettings":
                instances.push({
                    objectName: "outlierSettings",
                    properties: {
                        outlierSize: this.settings.outlierSize,
                        outlierOpacity: this.settings.outlierOpacity,
                        outlierStrokeWidth: this.settings.outlierStrokeWidth,
                        outlierStrokeColor: { solid: { color: this.settings.outlierStrokeColor } }
                    },
                    selector: null
                });
                break;
            case "meanSettings":
                instances.push({
                    objectName: "meanSettings",
                    properties: {
                        showMean: this.settings.showMean,
                        meanShape: this.settings.meanShape,
                        meanSize: this.settings.meanSize,
                        meanOpacity: this.settings.meanOpacity,
                        meanStrokeWidth: this.settings.meanStrokeWidth,
                        meanStrokeColor: { solid: { color: this.settings.meanStrokeColor } },
                        showMeanLabel: this.settings.showMeanLabel,
                        meanLabelFontSize: this.settings.meanLabelFontSize,
                        meanLabelColor: { solid: { color: this.settings.meanLabelColor } },
                        meanLabelBackground: this.settings.meanLabelBackground,
                        meanLabelBackgroundColor: { solid: { color: this.settings.meanLabelBackgroundColor } },
                        meanLabelBackgroundOpacity: this.settings.meanLabelBackgroundOpacity
                    },
                    selector: null
                });
                break;
            case "colors":
                instances.push({
                    objectName: "colors",
                    properties: {
                        boxColor: { solid: { color: this.settings.boxColor } },
                        medianColor: { solid: { color: this.settings.medianColor } },
                        meanColor: { solid: { color: this.settings.meanColor } },
                        outlierColor: { solid: { color: this.settings.outlierColor } }
                    },
                    selector: null
                });
                break;
        }
        
        return instances;
    }
}

interface BoxPlotData {
    category: string;
    values: number[];
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean: number;
    outliers: number[];
    count: number;
}

interface BoxPlotSettings {
    whiskerType: string;
    showOutliers: boolean;
    showDataPoints: boolean;
    dataPointSize: number;
    dataPointOpacity: number;
    boxColor: string;
    boxBorderWidth: number;
    boxBorderColor: string;
    medianColor: string;
    meanColor: string;
    outlierColor: string;
    autoRange: boolean;
    rangeStart: number;
    rangeEnd: number;
    focusOnIQR: boolean;
    clipOutliers: boolean;
    outlierSize: number;
    outlierOpacity: number;
    outlierStrokeWidth: number;
    outlierStrokeColor: string;
    // X Axis
    xAxisShow: boolean;
    xAxisShowTitle: boolean;
    xAxisSortOrder: string;
    xAxisLabelColor: string;
    xAxisLabelFontSize: number;
    xAxisLabelAngle: number;
    xAxisTitle: string;
    xAxisTitleColor: string;
    xAxisTitleFontSize: number;
    // Y Axis
    yAxisShow: boolean;
    yAxisShowTitle: boolean;
    yAxisLabelColor: string;
    yAxisLabelFontSize: number;
    yAxisTitle: string;
    yAxisTitleColor: string;
    yAxisTitleFontSize: number;
    // Grid Settings
    showGrid: boolean;
    gridColor: string;
    gridOpacity: number;
    gridStrokeWidth: number;
    // Mean Settings
    showMean: boolean;
    meanShape: string;
    meanSize: number;
    meanOpacity: number;
    meanStrokeWidth: number;
    meanStrokeColor: string;
    showMeanLabel: boolean;
    meanLabelFontSize: number;
    meanLabelColor: string;
    meanLabelBackground: boolean;
    meanLabelBackgroundColor: string;
    meanLabelBackgroundOpacity: number;
}