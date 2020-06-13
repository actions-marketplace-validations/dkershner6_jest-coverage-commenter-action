import { error, setFailed } from '@actions/core';
import { getOctokit as getOctokitImport, context } from '@actions/github';
import { Octokit } from '@octokit/core';

export const COMMENT_PREFIX = '## Jest Coverage';

const postComment = async (
    commentToPost: string,
    githubToken: string,
    getOctokitParam?: (token: string) => Octokit
): Promise<void> => {
    try {
        const prNumber = context?.issue?.number;
        const repo = context?.repo?.repo;
        const owner = context?.repo?.owner;

        if (!prNumber || !repo || !owner) {
            return setFailed(
                `Was unable to obtain: ${[prNumber, repo, owner]
                    .filter((item) => item === undefined)
                    .join(', ')} from context.`
            );
        }

        const getOctokit = getOctokitParam ?? getOctokitImport;
        const github = getOctokit(githubToken);

        const prComments = await github.issues.listComments({
            issue_number: prNumber,
            repo,
            owner,
        });

        const existingComment = prComments?.data?.find(
            (comment: { user: { type: string }; body: string }) =>
                comment?.user?.type === 'Bot' &&
                comment?.body?.startsWith(COMMENT_PREFIX)
        );

        const commentBody = `${COMMENT_PREFIX}
        
        ${commentToPost}`;

        if (existingComment) {
            await github.issues.updateComment({
                issue_number: prNumber,
                comment_id: existingComment.comment_id,
                repo,
                owner,
                body: commentBody,
            });
        } else {
            await github.issues.createComment({
                issue_number: prNumber,
                repo,
                owner,
                body: commentBody,
            });
        }
    } catch (err) {
        error('There was an error while posting the comment');
        throw err;
    }
};

export default postComment;