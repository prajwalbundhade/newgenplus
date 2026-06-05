import type {
  PromptCardVM,
  PromptDetailVM,
  PublicReviewVM,
} from '@/features/prompts/queries/prompt.queries'
import type { TaxonomyItem, TaxonomyItemWithCount } from '@/features/taxonomy/queries/taxonomy.queries'
import type { CategoryRow, ModelRow } from '@/types/database.types'

export interface FaqItem {
  question: string
  answer: string
}

function cleanText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

function lower(value: string): string {
  return value.toLowerCase()
}

function unique(values: Array<string | null | undefined>): string[] {
  const out = new Set<string>()
  for (const value of values) {
    const cleaned = cleanText(value)
    if (cleaned) out.add(cleaned)
  }
  return [...out]
}

function firstSentence(value: string | null | undefined): string {
  const text = cleanText(value)
  if (!text) return ''
  const match = text.match(/^(.+?[.!?])(?:\s|$)/)
  return match?.[1] ?? text
}

function listNames(items: string[], fallback: string): string {
  if (items.length === 0) return fallback
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

export function buildPromptAiContent(
  prompt: PromptDetailVM,
  reviews: PublicReviewVM[],
  sameCategory: PromptCardVM[],
  sameModel: PromptCardVM[]
) {
  const categoryName = prompt.category?.name ?? 'AI creative'
  const categoryLower = lower(categoryName)
  const modelName = prompt.model?.name ?? prompt.modelName ?? 'the selected AI model'
  const tagPhrase = listNames(prompt.tags.slice(0, 4), categoryLower)
  const description = cleanText(prompt.description)
  const promptLead = firstSentence(prompt.promptText)

  const whatItDoes = description
    ? `${prompt.title} is a ${categoryLower} prompt for ${modelName}. ${description}`
    : `${prompt.title} is a ${categoryLower} prompt for ${modelName}. It is built around: ${promptLead}`

  const useCases = unique([
    `Generate ${categoryLower} outputs with a clear visual direction.`,
    prompt.tags[0] ? `Explore ${tagPhrase} styles, subjects, and compositions.` : null,
    prompt.category ? `Build variations for ${lower(prompt.category.name)} concepts.` : null,
    reviews.length > 0 ? `Reuse a prompt that has approved feedback from NeuwGenX readers.` : null,
    sameCategory.length > 0 ? `Compare it with other ${categoryLower} prompts before copying.` : null,
  ]).slice(0, 5)

  const recommendedModels = unique([
    modelName,
    ...sameModel.map((item) => item.modelName),
  ]).slice(0, 4)

  const tips = unique([
    `Run the prompt once in ${modelName} before changing style or aspect-ratio terms.`,
    prompt.tags.length > 0
      ? `Use the tags ${listNames(prompt.tags.slice(0, 3), categoryLower)} as variation handles.`
      : null,
    prompt.category
      ? `For ${lower(prompt.category.name)} work, adjust the subject, lighting, background, and format while keeping the strongest descriptive terms.`
      : null,
    prompt.avgRating !== null
      ? `Check the reviews and rating before adapting the prompt for client or production work.`
      : null,
  ]).slice(0, 4)

  return {
    whatItDoes,
    useCases,
    recommendedModels,
    tips,
  }
}

export function buildCategoryAiContent(
  category: CategoryRow,
  prompts: PromptCardVM[],
  relatedCategories: TaxonomyItem[]
) {
  const categoryName = category.name
  const description = cleanText(category.description)
  const models = unique(prompts.map((prompt) => prompt.modelName)).slice(0, 5)
  const promptTitles = prompts.slice(0, 3).map((prompt) => prompt.title)

  const overview = description
    ? `${categoryName} prompts on NeuwGenX focus on ${lower(description)}`
    : `${categoryName} prompts on NeuwGenX collect practical prompt ideas for creators who want fast, repeatable AI results.`

  const faqs: FaqItem[] = [
    {
      question: `What are ${categoryName} AI prompts best for?`,
      answer:
        description ||
        `${categoryName} AI prompts are best for generating focused creative outputs without writing every prompt from scratch.`,
    },
    {
      question: `Which models work well for ${categoryName} prompts?`,
      answer:
        models.length > 0
          ? `${categoryName} prompts in this collection are commonly associated with ${listNames(models, 'the listed models')}.`
          : `Use the model listed on each prompt page; NeuwGenX keeps model associations attached to every published prompt.`,
    },
    {
      question: `How should I choose a ${categoryName} prompt?`,
      answer:
        promptTitles.length > 0
          ? `Start with prompts such as ${listNames(promptTitles, categoryName)} and compare the title, model, image, tags, and prompt text before copying.`
          : `Choose based on the model, tags, preview image, and the result style described on the prompt page.`,
    },
  ]

  return {
    overview,
    models,
    faqs,
    relatedCategories,
  }
}

export function buildModelAiContent(
  model: ModelRow,
  prompts: PromptCardVM[],
  relatedModels: TaxonomyItemWithCount[]
) {
  const modelName = model.name
  const description = cleanText(model.description)
  const categories = unique(
    prompts.map((prompt) => {
      const title = prompt.title.toLowerCase()
      if (title.includes('portrait')) return 'portrait prompts'
      if (title.includes('product')) return 'product prompts'
      if (title.includes('cinematic')) return 'cinematic prompts'
      if (title.includes('logo')) return 'logo prompts'
      return prompt.modelName === modelName ? null : prompt.modelName
    })
  ).slice(0, 5)
  const topTitles = prompts.slice(0, 3).map((prompt) => prompt.title)

  const overview = description
    ? `${modelName} prompts on NeuwGenX are curated around this model profile: ${description}`
    : `${modelName} prompts on NeuwGenX are curated examples designed for fast copying, testing, and iteration in ${modelName}.`

  const strengths = unique([
    model.provider ? `${model.provider} ecosystem support` : null,
    prompts.length > 0 ? `A growing set of real published prompts for ${modelName}` : null,
    topTitles.length > 0 ? `Prompt patterns visible in examples such as ${listNames(topTitles, modelName)}` : null,
  ])

  const bestPromptTypes =
    categories.length > 0 ? categories : ['image prompts', 'visual direction prompts', 'creative prompt variations']

  const faqs: FaqItem[] = [
    {
      question: `What is ${modelName} good for on NeuwGenX?`,
      answer:
        description ||
        `${modelName} is used for prompts where the model association helps creators copy, test, and adapt results quickly.`,
    },
    {
      question: `What prompt types work best with ${modelName}?`,
      answer: `${modelName} is represented here across ${listNames(bestPromptTypes, 'published prompt types')}.`,
    },
    {
      question: `How do I adapt a ${modelName} prompt?`,
      answer: `Copy the prompt, run it once in ${modelName}, then adjust the subject, style terms, composition, and format while preserving the parts that define the intended result.`,
    },
  ]

  return {
    overview,
    strengths,
    bestPromptTypes,
    faqs,
    relatedModels,
  }
}
