import Groq from "groq-sdk";

interface ChartConfig {
  chartType: string;
  xAxis: string;
  yAxis: string;
  title: string;
  filter?: {
    column: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';
    value: number | string | [number, number];
  };
  aggregation?: {
    type: 'count' | 'sum' | 'average' | 'max' | 'min';
    column?: string;
    groupBy?: string;
  };
}

export async function analyzeQuery(
  query: string,
  headers: string[],
  apiKey: string
): Promise<ChartConfig> {
  const groq = new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  const systemPrompt = `You are a data visualization expert. Analyze the query and respond with a JSON object that includes visualization configuration and data processing instructions. The response should be ONLY JSON, no other text.`;
  
  const userPrompt = `Given a dataset with columns [${headers.join(', ')}] and the query: "${query}"

Respond with a JSON object that includes:
1. Chart configuration
2. Data filtering conditions (if needed)
3. Data aggregation instructions (if needed)

Use this exact format:
{
  "chartType": "line|bar|scatter|pie",
  "xAxis": "<column name>",
  "yAxis": "<column name>",
  "title": "<descriptive title>",
  "filter": {
    "column": "<column name>",
    "operator": "gt|lt|eq|gte|lte|between",
    "value": <number or [min, max] for between>
  },
  "aggregation": {
    "type": "count|sum|average|max|min",
    "column": "<column to aggregate>",
    "groupBy": "<column to group by>"
  }
}

Examples of query interpretation:
1. "Show students who scored above 90" -> filter scores > 90
2. "Average scores by grade" -> aggregate average scores grouped by grade
3. "Count of students by grade with scores above 80" -> filter scores > 80, count students grouped by grade

Note: Only include filter and aggregation if relevant to the query.`;

  try {
    console.log('Making request to Groq API...');
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content;
    console.log('Raw API Response:', completion);

    if (!content) {
      throw new Error('No content in API response');
    }

    let cleanedContent = content.trim();
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    cleanedContent = cleanedContent.replace(/,(\s*[}\]])/g, '$1');

    console.log('Cleaned Content:', cleanedContent);

    let parsedContent: ChartConfig;
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      console.error('Failed content:', cleanedContent);
      throw new Error('Failed to parse API response as JSON');
    }

    // Validate the response
    if (!parsedContent.chartType || !parsedContent.xAxis || !parsedContent.yAxis || !parsedContent.title) {
      console.error('Invalid Chart Config:', parsedContent);
      throw new Error('Invalid chart configuration received from API');
    }

    // Validate chart type
    const validChartTypes = ['line', 'bar', 'scatter', 'pie'];
    if (!validChartTypes.includes(parsedContent.chartType.toLowerCase())) {
      throw new Error(`Invalid chart type: ${parsedContent.chartType}`);
    }

    // Validate columns exist
    if (!headers.includes(parsedContent.xAxis)) {
      throw new Error(`X-axis column "${parsedContent.xAxis}" not found in dataset`);
    }
    if (!headers.includes(parsedContent.yAxis)) {
      throw new Error(`Y-axis column "${parsedContent.yAxis}" not found in dataset`);
    }

    return parsedContent;
  } catch (error) {
    console.error('Error in analyzeQuery:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

export async function generateInsights(
  prompt: string,
  apiKey: string
): Promise<string> {
  const groq = new Groq({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a data analyst. Provide clear, concise insights about the data in 3-4 sentences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in API response');
    }

    return content.trim();
  } catch (error) {
    console.error('Error in generateInsights:', error);
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
} 