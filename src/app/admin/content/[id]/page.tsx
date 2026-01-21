import ArticleEditor from '../_components/ArticleEditor';

interface ArticleEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticleEditorPage({ params }: ArticleEditorPageProps) {
  const { id } = await params;
  return <ArticleEditor articleId={id} />;
}
