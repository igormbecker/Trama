import { getServerSideProps as getWorksProps } from "./works/index";
import chapterRequest from "models/chapterRequest";

export async function getServerSideProps(context) {
  const result = await getWorksProps(context);
  if (!result.props) {
    return result;
  }
  const participations = await chapterRequest.findForAssignee(
    result.props.user.id,
  );
  return {
    props: {
      ...result.props,
      participations: JSON.parse(JSON.stringify(participations)),
    },
  };
}
export { default } from "components/home/WorkspacePage";
