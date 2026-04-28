const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  // Only run on POST from Netlify deploy or CMS publish
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const owner = "EVNIKAFASHION";
  const repo = "EVNIKA";
  const branch = "main";

  try {
    // Get all files in _products/
    const { data } = await octokit.repos.getContent({
      owner, repo, path: "_products", ref: branch,
    });

    // Filter only .json files, exclude index.json itself
    const files = data
      .filter((f) => f.name.endsWith(".json") && f.name !== "index.json")
      .map((f) => f.name);

    const content = Buffer.from(JSON.stringify(files, null, 2)).toString("base64");

    // Check if index.json already exists (need its SHA to update)
    let sha;
    try {
      const existing = await octokit.repos.getContent({
        owner, repo, path: "_products/index.json", ref: branch,
      });
      sha = existing.data.sha;
    } catch (_) {}

    // Create or update _products/index.json
    await octokit.repos.createOrUpdateFileContents({
      owner, repo, branch,
      path: "_products/index.json",
      message: "Auto-update product index",
      content,
      ...(sha ? { sha } : {}),
    });

    return { statusCode: 200, body: "index.json updated" };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
