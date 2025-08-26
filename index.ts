import 'dotenv/config'
import express from 'express'
import { clerkMiddleware, getAuth, requireAuth, clerkClient, } from '@clerk/express'
import cors from 'cors'
import { PrismaClient } from './generated/prisma/index.js'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import bodyParser from 'body-parser'
import { Webhook } from 'svix'

var prisma = new PrismaClient()

const app = express()
const PORT = 4000

app.use(clerkMiddleware())
app.use(cors())

app.get('/v1/parsebookmark/:id', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      id: req.params.id,
    }
  })
  if (!bookmark) {
    return res.status(404).json({ error: 'Bookmark not found' })
  }
  const url = bookmark.url
  var content = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  }).then((response) => response.text())
  const dom = new JSDOM(content)
  const reader = new Readability(dom.window.document)
  const article = reader.parse()
  return res.json(article?.content)
})

app.get('/v1/lists', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const lists = await prisma.list.findMany({
    where: {
      owner: user.userId
    },
    include: {
      bookmarks: true
    }
  })
  return res.json(lists)
})

app.get('/v1/lists/:id/bookmarks', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const list = await prisma.list.findUnique({
    where: {
      id: req.params.id
    },
    select: {
      bookmarks: true
    }
  })
  return res.json(list)
})

app.post('/v1/lists/:id/bookmarks', requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const list = await prisma.list.findUnique({
    where: {
      id: req.params.id
    },
    select: {
      bookmarks: true
    }
  })
  if (!list) {
    return res.status(404).json({ error: 'List not found' })
  }
  const bookmark = await prisma.bookmark.create({
    data: {
      title: req.body.title,
      url: req.body.url,
      owner: user.userId,
      listId: req.params.id
    },
  })
  return res.json(bookmark)
})

app.get('/v1/bookmarks/:id/info', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      id: req.params.id
    },
    select: {
      list: true,
      owner: true,
      readBy: true,
      createdAt: true,
      title: true,
      url: true,
      listId: true
    }
  })
  return res.json(bookmark)
})

app.delete('/v1/bookmarks/:id/delete', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const bookmark = await prisma.bookmark.delete({
    where: {
      id: req.params.id
    }
  })
  return res.json(bookmark)
})

app.post('/v1/rssfeeds', requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const rssFeed = await prisma.rSSFeed.create({
    data: {
      url: req.body.url,
      owner: user.userId
    },
  })
  return res.json(rssFeed)
})

app.get('/v1/rssfeeds', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const rssFeeds = await prisma.rSSFeed.findMany({
    where: {
      owner: user.userId
    }
  })
  return res.json(rssFeeds)
})

app.get('/v1/rssfeed/id/:id/info', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const rssFeed = await prisma.rSSFeed.findUnique({
    where: {
      id: req.params.id
    }
  })
  return res.json(rssFeed)
})

app.delete('/v1/rssfeeds/:id/delete', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const rssFeed = await prisma.rSSFeed.delete({
    where: {
      id: req.params.id
    }
  })
  return res.json(rssFeed)
})

app.post('/v1/bookmarks/:id/read', requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const bookmark = await prisma.bookmark.findUnique({
    where: {
      id: req.params.id
    },
    select: {
      list: true,
      owner: true,
      readBy: true,
      createdAt: true,
      title: true,
      url: true,
      listId: true
    }
  })
  if (!bookmark) {
    return res.status(404).json({ error: 'Bookmark not found' })
  }
  if (req.body.state === false) {
    const updatedBookmark = await prisma.bookmark.update({
      where: {
        id: req.params.id
      },
      data: {
        readBy: {
          set: bookmark.readBy.filter((id) => id !== user.userId)
        }
      }
    })
    return res.json(updatedBookmark)
  } else {
    const updatedBookmark = await prisma.bookmark.update({
      where: {
        id: req.params.id
      },
      data: {
        readBy: {
          push: user.userId
        }
      }
    })
    return res.json(updatedBookmark)
  }
})

app.get('/v1/lists/:id/info', requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const list = await prisma.list.findUnique({
    where: {
      id: req.params.id
    }
  })
  return res.json(list)
})

app.post('/v1/lists', requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const list = await prisma.list.create({
    data: {
      name: req.body.name,
      owner: user.userId
    },
  })
  return res.json(list)
})

app.post('/webhook/subscription', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const secret = process.env.SVIX_SECRET
  const payload = req.body;
  const headers = req.headers;

  const wh = new Webhook(secret!);
  let msg;
  try {
      msg = wh.verify(payload, headers);
  } catch (err) {
      res.status(400).json({ error: 'Invalid signature' });
  }
  console.log(msg)
  if (msg.data.payer.organization_id !== '') {
    if (msg.data.items.filter((item: any) => {
      return item.plan.slug === "blog_pro"
    }).length > 0) {
      clerkClient.organizations.updateOrganization(msg.data.payer.organization_id, {
        maxAllowedMemberships: 5
      })
    } else {
      clerkClient.organizations.updateOrganization(msg.data.payer.organization_id, {
        maxAllowedMemberships: 1
      })
    }
    const blogSubObject = await prisma.blogSubscription.findUnique({
      where: {
        blogId: msg.data.payer.organization_id
      }
    })
    if (!blogSubObject) {
      console.log("Creating blog subscription")
      console.log(msg.data.items)
      const blogSub = await prisma.blogSubscription.create({
        data: {
          blogId: msg.data.payer.organization_id,
          plan: (msg.data.items.filter((item: any) => {
            return item.plan.slug === "blog_pro"
          }).length > 0) ? "blog_pro" : "blog_free"
        }
      })
      return res.json(blogSub)
    } else {
      console.log("Updating blog subscription")
      console.log(msg.data.items)
      console.log(msg.data.items.filter((item: any) => {
        return item.plan.slug === "blog_pro"
      }).length)
      const blogSub = await prisma.blogSubscription.update({
        where: {
          blogId: msg.data.payer.organization_id
        },
        data: {
          plan: (msg.data.items.filter((item: any) => {
            return item.plan.slug === "blog_pro"
          }).length > 0) ? "blog_pro" : "blog_free"
        }
      })
      return res.json(blogSub)
    }
  }
  return res.json({ message: 'success' })
})

app.get("/v1/bookmarks/search", requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      owner: user.userId,
      title: {
        contains: req.query.q as string,
        mode: "insensitive"
      }
    }
  })
  return res.json(bookmarks)
})

app.get('/v1/blog/:slug/info', async (req, res) => {
    try {
    const org = await clerkClient.organizations.getOrganization({
        slug: req.params.slug
    })
    console.log(org)
    const blogSubObject = await prisma.blogSubscription.findUnique({
      where: {
        blogId: org.id
      }
    })
    return res.json({
        imageUrl: org.imageUrl,
        name: org.name,
        slug: org.slug,
        id: org.id,
        plan: blogSubObject?.plan
    })
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Organization not found', action: 'show404blogpage' })
    }
})

app.get("/v1/blog/:slug/authors", async (req, res) => {
    try {
        const org = await clerkClient.organizations.getOrganization({
            slug: req.params.slug
        })
        const authors = await clerkClient.organizations.getOrganizationMembershipList({
            organizationId: org.id
        })
        return res.json(await Promise.all(authors.data.map(async (author) => {
            const user = await clerkClient.users.getUser(author.publicUserData?.userId!)
            return {
                name: {
                  firstName: user.firstName,
                  lastName: user.lastName
                },
                imageUrl: user.imageUrl,
                username: user.username,
                id: user.id
            }
        })))
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Organization not found', action: 'show404blogpage' })
    }
})

app.get("/v1/blog/:slug/author/:id/posts", async (req, res) => {
  try {
      const org = await clerkClient.organizations.getOrganization({
          slug: req.params.slug
      })
      const user = await clerkClient.users.getUser(req.params.id)
      if (!user) {
          return res.status(404).json({ error: 'User not found', action: 'show404blogpage' })
      }
      const posts = await prisma.blogPost.findMany({
          where: {
              blogid: org.id,
              writer: user.id,
              public: true
          }
      })
      return res.json(posts)
  } catch (error) {
      console.log(error)
      return res.status(404).json({ error: 'Organization not found', action: 'show404blogpage' })
  }
})

app.get("/v1/blog/:slug/posts", async (req, res) => {
    try {
        const org = await clerkClient.organizations.getOrganization({
            slug: req.params.slug
        })
        const user = getAuth(req)
        const memberlist = await clerkClient.organizations.getOrganizationMembershipList({
            organizationId: org.id
        })
        const hasMember = memberlist.data.some((member) => member.publicUserData?.userId === user.userId)
        let posts;
        if (!hasMember) {
          console.log("user is not a member")
          posts = await prisma.blogPost.findMany({
            where: {
                blogid: org.id,
                public: true
            }
          })
          console.log(posts)
        } else {
          console.log("user is a member")
          posts = await prisma.blogPost.findMany({
            where: {
                blogid: org.id
            }
          })
          console.log(posts)
        }
        console.log(posts)
        return res.json(posts)
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Organization not found', action: 'show404blogpage' })
    }
})

app.post("/v1/blog/:slug/posts", requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const org = await clerkClient.organizations.getOrganization({
    slug: req.params.slug
  })
  const memberlist = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: org.id
  })
  const hasMember = memberlist.data.some((member) => member.publicUserData?.userId === user.userId)
  if (!hasMember) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const post = await prisma.blogPost.create({
    data: {
      title: req.body.title,
      blogid: org.id,
      writer: user.userId
    },
  })
  return res.json(post)
})

app.post("/v1/blog/:slug/posts/:id/publish", requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const org = await clerkClient.organizations.getOrganization({
    slug: req.params.slug
  })
  const memberlist = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: org.id
  })
  const hasMember = memberlist.data.some((member) => member.publicUserData?.userId === user.userId)
  if (!hasMember) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const post = await prisma.blogPost.findUnique({
    where: {
      id: req.params.id,
      blogid: org.id
    }
  })
  if (!post) {
    return res.status(404).json({ error: 'Post not found' })
  }
  console.log(post.draftContent, post.content)
  const newpost = await prisma.blogPost.update({
    where: {
      id: req.params.id,
      blogid: org.id
    },
    data: {
      content: post.draftContent
    },
  })
  return res.json(newpost)
})

app.put("/v1/blog/:slug/posts/:id", requireAuth(), express.json(), async (req, res) => {
  console.log("request received for updating post")
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const org = await clerkClient.organizations.getOrganization({
    slug: req.params.slug
  })
  const memberlist = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: org.id
  })
  const hasMember = memberlist.data.some((member) => member.publicUserData?.userId === user.userId)
  if (!hasMember) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (req.body.title) {
    console.log("updating title")
    const post = await prisma.blogPost.update({
      where: {
        id: req.params.id,
        blogid: org.id
      },
      data: {
        title: req.body.title
      },
    })
  }
  if (req.body.content) {
    console.log("updating content")
    const post = await prisma.blogPost.update({
      where: {
        id: req.params.id,
        blogid: org.id
      },
      data: {
        content: req.body.content
      },
    })
  }
  if (req.body.draftContent) {
    console.log("updating draft content")
    const post = await prisma.blogPost.update({
      where: {
        id: req.params.id,
        blogid: org.id
      },
      data: {
        draftContent: req.body.draftContent
      },
    })
  }
  if (req.body.public !== undefined) {
    console.log("updating public")
    console.log(req.body.public)
    const post = await prisma.blogPost.update({
      where: {
        id: req.params.id,
        blogid: org.id
      },
      data: {
        public: req.body.public
      },
    })
  }
  if (req.body.tags) {
    console.log("updating tags")
    const post = await prisma.blogPost.update({
      where: {
        id: req.params.id,
        blogid: org.id
      },
      data: {
        tags: req.body.tags
      },
    })
  }
  return res.json({ message: 'success' })
})

app.get("/v1/blog/:slug/posts/:id/info", async (req, res) => {
    try {
        const auth = getAuth(req)
        const org = await clerkClient.organizations.getOrganization({
            slug: req.params.slug
        })
        const orgmemberlist = await clerkClient.organizations.getOrganizationMembershipList({
            organizationId: org.id
        })
        const hasMember = orgmemberlist.data.some((member) => member.publicUserData?.userId === auth.userId)
        let post;
        if (!hasMember) {
          post = await prisma.blogPost.findUnique({
            where: {
                id: req.params.id,
                blogid: org.id,
                public: true
            },
            select: {
              id: true,
              title: true,
              content: true,
              public: true,
              tags: true,
              createdAt: true,
              updatedAt: true,
              writer: true,
              blogid: true,
            }
          })
        } else {
          post = await prisma.blogPost.findUnique({
            where: {
                id: req.params.id,
                blogid: org.id
            }
          })
        }
        console.log(JSON.stringify(post?.content) != JSON.stringify(post?.draftContent))
        post.isEdited = JSON.stringify(post?.content) != JSON.stringify(post?.draftContent)
        return res.json(post)
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Post not found', action: 'show404blogpage' })
    }
})

app.get("/v1/blog/:slug/posts/:id/needspublish", requireAuth(), async (req, res) => {
  try {
      const auth = getAuth(req)
      const org = await clerkClient.organizations.getOrganization({
          slug: req.params.slug
      })
      const orgmemberlist = await clerkClient.organizations.getOrganizationMembershipList({
          organizationId: org.id
      })
      const hasMember = orgmemberlist.data.some((member) => member.publicUserData?.userId === auth.userId)
      const post = await prisma.blogPost.findUnique({
        where: {
            id: req.params.id,
            blogid: org.id
        }
      })
      return res.json({needsPublish: JSON.stringify(post?.content) != JSON.stringify(post?.draftContent)})
  } catch (error) {
      console.log(error)
      return res.status(404).json({ error: 'Post not found', action: 'show404blogpage' })
  }
})

app.delete("/v1/blog/:slug/posts/:id/delete", requireAuth(), async (req, res) => {
  try {
      const org = await clerkClient.organizations.getOrganization({
          slug: req.params.slug
      })
      var post = await prisma.blogPost.findUnique({
          where: {
              id: req.params.id,
              blogid: org.id
          }
      })
      if (!post) {
        return res.status(404).json({ error: 'Post not found', action: 'show404blogpage' })
      }
      await prisma.blogPost.delete({
        where: {
          id: req.params.id,
          blogid: org.id
        }
      })
      return res.json({ message: 'success' })
  } catch (error) {
      console.log(error)
      return res.status(404).json({ error: 'Post not found', action: 'show404blogpage' })
  }
})

app.get("/v1/user/:id/publicinfo", async (req, res) => {
    try {
        const user = await clerkClient.users.getUser(req.params.id)
        return res.json({
          name: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
          imageUrl: user.imageUrl,
          username: user.username,
        })
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'User not found', action: 'show404userpage' })
    }
})

app.get("/", (req, res) => {
  console.log("Hello World!")
  res.json({ message: 'Hello World!' })
})

app.get("/v1/social/me/communities", requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const ismember = await prisma.socialCommunity.findMany({
    where: {
      members: {
        has: user.userId
      }
    }
  })
  const isadmin = await prisma.socialCommunity.findMany({
    where: {
      admins: {
        has: user.userId
      }
    }
  })
  return res.json({
    member: ismember,
    admin: isadmin
  })
})

app.get("/v1/social/communities/id/:id/info", async (req, res) => {
  const community = await prisma.socialCommunity.findUnique({
    where: {
      id: req.params.id
    }
  })
  return res.json(community)
})

app.post("/v1/social/communities", requireAuth(), express.json(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const community = await prisma.socialCommunity.create({
    data: {
      name: req.body.name,
      description: req.body.description,
      admins: [user.userId],
      members: [user.userId]
    },
  })
  return res.json(community)
})

async function PrepareFeed(feed: SocialPost[]) {
  const DECAY_FACTOR = 24 * 60 * 60 * 1000;

  feed.forEach((post) => {
      const netVotes = post.boostedBy.length - post.deboostedBy.length;
      const hoursSinceCreation = (new Date() - post.createdAt) / (60 * 60 * 1000);
      const gravity = 1.8;
      post.points = netVotes
      post.algopoints = post.points / Math.pow((hoursSinceCreation + 2), gravity);
  });
  feed.sort((a, b) => b.algopoints - a.algopoints);
  await Promise.all(feed.map(async (post) => {
    var user = await clerkClient.users.getUser(post.author)
    post.userInfo = {
      name: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      imageUrl: user.imageUrl,
      username: user.username,
    }
  }))
  return feed
}

app.get("/v1/social/me/feed", requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  console.log(user)
  const feed = await prisma.socialPost.findMany({
    where: {
      communityId: {
        in: await prisma.socialCommunity.findMany({
          where: {
            members: {
              has: user.userId
            }
          }
        }).then((communities) => communities.map((community) => community.id))
      }
    },
    include: {
      community: true,
      _count: {select: {comments: true}}
    }
  })
  var newfeed = await PrepareFeed(feed)
  return res.json(newfeed)
})

app.get("/v1/social/communities/id/:id/posts", async (req, res) => {
  const community = await prisma.socialCommunity.findUnique({
    where: {
      id: req.params.id
    }
  })
  const posts = await prisma.socialPost.findMany({
    where: {
      communityId: community.id
    },
    include: {
      community: true,
      _count: {select: {comments: true}}
    }
  })
  var newfeed = await PrepareFeed(posts)
  return res.json(newfeed)
})

app.post("/v1/social/communities/id/:id/posts", requireAuth(), express.json(), async (req, res) => {
  console.log("post making")
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const community = await prisma.socialCommunity.findUnique({
    where: {
      id: req.params.id
    }
  })
  if (!community) {
    return res.status(404).json({ error: 'Community not found' })
  }
  if(!req.body.link) {
    return res.status(400).json({ error: 'Missing link' })
  }
  const post = await prisma.socialPost.create({
    data: {
      author: user.userId,
      communityId: community.id,
      link: req.body.link,
    },
  })
  console.log(post)
  return res.json(post)
})

app.post("/v1/social/posts/id/:id/boost", requireAuth(), express.json(), async (req, res) => {
  console.log("post boosting")
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const socialpost = await prisma.socialPost.findUnique({
    where: {
      id: req.params.id
    }
  })
  if (!socialpost) {
    return res.status(404).json({ error: 'Post not found' })
  }
  let post
  if(req.body.state === false && socialpost.boostedBy.includes(user.userId)) {
    post = await prisma.socialPost.update({
      where: {
        id: req.params.id
      },
      data: {
        boostedBy: {
          set: socialpost.boostedBy.filter((id) => id !== user.userId)
        }
      }
    })
  } else if(req.body.state === true && !socialpost.boostedBy.includes(user.userId)) {
    post = await prisma.socialPost.update({
      where: {
        id: req.params.id
      },
      data: {
        boostedBy: {
          push: user.userId
        }
      }
    })
  }
  return res.json(post)
})

app.post("/v1/social/communities/id/:id/membership", requireAuth(), express.json(), async (req, res) => {
  console.log("community membership")
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const community = await prisma.socialCommunity.findUnique({
    where: {
      id: req.params.id
    }
  })
  if (!community) {
    return res.status(404).json({ error: 'Community not found' })
  }
  let community1
  if(!community.members.includes(user.userId) && req.body.state === true) {
    community1 = await prisma.socialCommunity.update({
      where: {
        id: req.params.id
      },
      data: {
        members: {
          push: user.userId
        }
      }
    })
  } else if(community.members.includes(user.userId) && req.body.state === false) {
    community1 = await prisma.socialCommunity.update({
      where: {
        id: req.params.id
      },
      data: {
        members: {
          set: community.members.filter((id) => id !== user.userId)
        }
      }
    })
  }
  return res.json(community1)
})

app.post("/v1/social/posts/id/:id/deboost", requireAuth(), express.json(), async (req, res) => {
  console.log("post deboosting")
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const socialpost = await prisma.socialPost.findUnique({
    where: {
      id: req.params.id
    }
  })
  if (!socialpost) {
    return res.status(404).json({ error: 'Post not found' })
  }
  let post
  if(req.body.state === false && socialpost.deboostedBy.includes(user.userId)) {
    post = await prisma.socialPost.update({
      where: {
        id: req.params.id
      },
      data: {
        deboostedBy: {
          set: socialpost.deboostedBy.filter((id) => id !== user.userId)
        }
      }
    })
  } else if(req.body.state === true && !socialpost.deboostedBy.includes(user.userId)) {
    post = await prisma.socialPost.update({
      where: {
        id: req.params.id
      },
      data: {
        deboostedBy: {
          push: user.userId
        }
      }
    })
  }
  return res.json(post)
})

app.get("/v1/social/communities/search", requireAuth(), async (req, res) => {
  const user = getAuth(req)
  if (!user.userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  console.log("request received")
  const communities = await prisma.socialCommunity.findMany({
    where: {
      name: {
        contains: req.query.q as string,
        mode: "insensitive"
      }
    }
  })
  return res.json(communities)
})

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`WordScribe Backend listening at http://localhost:${PORT}`)
})