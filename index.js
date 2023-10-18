const express = require('express');
const axios = require('axios');
const lodash = require('lodash');
const app = express();
const port = 3000;

const BLOG_API_URL = 'https://intent-kit-16.hasura.app/api/rest/blogs';
const SECRET_HEADER = 'x-hasura-admin-secret';
const SECRET_VALUE = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';

const fetchData = async (req, res, next) => {
  try {
    const response = await axios.get(BLOG_API_URL, {
      headers: {
        [SECRET_HEADER]: SECRET_VALUE
      }
    });
    req.blogData = response.data.blogs;
    next();
  } catch (error) {
    res.status(500).json({ error: "Error fetching.." });
  }
};
const analyzeData = (req, res, next) => {
  try {
    const blogs = req.blogData;

    const totalBlogs = blogs.length;
    const longBlogTitle = lodash.maxBy(blogs, 'title');
    const blogPrivacy = lodash.filter(blogs, blog => blog.title.toLowerCase().includes('privacy')).length;
    const uniqueTitles = lodash.uniqBy(blogs, 'title').map(blog => blog.title);

    req.analyticsData = {
      totalBlogs,
      longestTitle: longBlogTitle ? longBlogTitle.title : null,
      blogPrivacy,
      uniqueTitles
    };

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

app.get('/api/blog-stats', fetchData, analyzeData, (req, res) => {
  res.json(req.analyticsData);
});

app.get('/api/blog-search', fetchData, (req, res) => {
  const query = (req.query.query || '').toLowerCase();
  const filteredBlogs = req.blogData.filter(blog => blog.title.toLowerCase().includes(query));
  res.json(filteredBlogs);
});

const memoData = lodash.memoize(
  async () => {
    const response = await axios.get(BLOG_API_URL, {
      headers: {
        [SECRET_HEADER]: SECRET_VALUE
      }
    });
    const blogs = response.data.blogs;

    const totalBlogs = blogs.length;
    const longBlogTitle = lodash.maxBy(blogs, 'title');
    const blogPrivacy = lodash.filter(blogs, blog => blog.title.toLowerCase().includes('privacy')).length;
    const uniqueTitles = lodash.uniqBy(blogs, 'title').map(blog => blog.title);

    return {
      totalBlogs,
      longestTitle: longBlogTitle ? longBlogTitle.title : null,
      blogPrivacy,
      uniqueTitles
    };
  },
  () => 'analyticsKey'
);

app.get('/api/memoized-blog-stats', async (req, res) => {
  try {
    const data = await memoData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Fail to get memoized blog data.'
    });
  }
});

app.listen(port, () => {
  console.log(`Listening at localhost:${port}`);
});
