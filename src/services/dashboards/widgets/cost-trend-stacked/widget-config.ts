import type { WidgetConfig } from '@/services/dashboards/widgets/config';
import { CHART_TYPE, GROUP_BY } from '@/services/dashboards/widgets/config';
import { GROUP_BY_ITEM_MAP } from '@/services/dashboards/widgets/view-config';

const costTrendStackedWidgetConfig: WidgetConfig = {
    widget_config_id: 'costTrendStacked',
    base_configs: [{ config_id: 'dashboardCommon' }, { config_id: 'baseTrend' }],
    title: 'Cost Trend Stacked',
    labels: ['Cost'],
    description: {
        translation_id: 'DASHBOARDS.WIDGET.COST_TREND_STACKED.DESC',
        preview_image: 'widget-img_costTrendStacked--thumbnail.png',
    },
    scopes: ['PROJECT', 'WORKSPACE'],
    theme: {
        inherit: true,
    },
    sizes: ['lg', 'full'],
    widget_options: {
        granularity: 'MONTHLY',
        chart_type: CHART_TYPE.STACKED_COLUMN,
        legend_options: {
            enabled: true,
            show_at: 'table',
        },
    },
    widget_options_schema: {
        schema: {
            type: 'object',
            properties: {
                group_by: {
                    title: 'Group By',
                    type: 'string',
                    enum: Object.values(GROUP_BY),
                    menuItems: Object.values(GROUP_BY_ITEM_MAP),
                },
            },
            required: ['group_by'],
        },
    },
};

export default costTrendStackedWidgetConfig;
