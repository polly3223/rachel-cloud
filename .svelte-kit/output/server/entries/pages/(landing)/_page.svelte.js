import "clsx";
import { Z as head, $ as attr, a1 as stringify, _ as ensure_array_like, a6 as attributes, a0 as attr_class } from "../../../chunks/index2.js";
import { e as escape_html } from "../../../chunks/context.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
function MetaTags($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      title = void 0,
      titleTemplate = void 0,
      robots = "index,follow",
      additionalRobotsProps = void 0,
      description = void 0,
      mobileAlternate = void 0,
      languageAlternates = void 0,
      twitter = void 0,
      facebook = void 0,
      openGraph = void 0,
      canonical = void 0,
      keywords = void 0,
      additionalMetaTags = void 0,
      additionalLinkTags = void 0
    } = $$props;
    let updatedTitle = titleTemplate ? title ? titleTemplate.replace(/%s/g, title) : title : title;
    let robotsParams = "";
    if (additionalRobotsProps) {
      const {
        nosnippet,
        maxSnippet,
        maxImagePreview,
        maxVideoPreview,
        noarchive,
        noimageindex,
        notranslate,
        unavailableAfter
      } = additionalRobotsProps;
      robotsParams = `${nosnippet ? ",nosnippet" : ""}${maxSnippet ? `,max-snippet:${maxSnippet}` : ""}${maxImagePreview ? `,max-image-preview:${maxImagePreview}` : ""}${noarchive ? ",noarchive" : ""}${unavailableAfter ? `,unavailable_after:${unavailableAfter}` : ""}${noimageindex ? ",noimageindex" : ""}${maxVideoPreview ? `,max-video-preview:${maxVideoPreview}` : ""}${notranslate ? ",notranslate" : ""}`;
    }
    head("1ycju9y", $$renderer2, ($$renderer3) => {
      if (updatedTitle) {
        $$renderer3.push("<!--[-->");
        $$renderer3.title(($$renderer4) => {
          $$renderer4.push(`<title>${escape_html(updatedTitle)}</title>`);
        });
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (robots !== false) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<meta name="robots"${attr("content", `${stringify(robots)}${stringify(robotsParams)}`)}/>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (description) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<meta name="description"${attr("content", description)}/>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (canonical) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<link rel="canonical"${attr("href", canonical)}/>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (keywords?.length) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<meta name="keywords"${attr("content", keywords.join(", "))}/>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (mobileAlternate) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<link rel="alternate"${attr("media", mobileAlternate.media)}${attr("href", mobileAlternate.href)}/>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (languageAlternates && languageAlternates.length > 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(languageAlternates);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let languageAlternate = each_array[$$index];
          $$renderer3.push(`<link rel="alternate"${attr("hreflang", languageAlternate.hrefLang)}${attr("href", languageAlternate.href)}/>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (twitter) {
        $$renderer3.push("<!--[-->");
        if (twitter.cardType) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:card"${attr("content", twitter.cardType)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.site) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:site"${attr("content", twitter.site)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.title) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:title"${attr("content", twitter.title)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.description) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:description"${attr("content", twitter.description)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.creator) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:creator"${attr("content", twitter.creator)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.creatorId) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:creator:id"${attr("content", twitter.creatorId)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.image) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:image"${attr("content", twitter.image)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.imageAlt) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:image:alt"${attr("content", twitter.imageAlt)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.player) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:player"${attr("content", twitter.player)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.playerWidth) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:player:width"${attr("content", twitter.playerWidth.toString())}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.playerHeight) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:player:height"${attr("content", twitter.playerHeight.toString())}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.playerStream) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:player:stream"${attr("content", twitter.playerStream)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appNameIphone) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:name:iphone"${attr("content", twitter.appNameIphone)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appIdIphone) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:id:iphone"${attr("content", twitter.appIdIphone)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appUrlIphone) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:url:iphone"${attr("content", twitter.appUrlIphone)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appNameIpad) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:name:ipad"${attr("content", twitter.appNameIpad)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appIdIpad) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:id:ipad"${attr("content", twitter.appIdIpad)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appUrlIpad) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:url:ipad"${attr("content", twitter.appUrlIpad)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appNameGoogleplay) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:name:googleplay"${attr("content", twitter.appNameGoogleplay)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appIdGoogleplay) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:id:googleplay"${attr("content", twitter.appIdGoogleplay)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (twitter.appUrlGoogleplay) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta name="twitter:app:url:googleplay"${attr("content", twitter.appUrlGoogleplay)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (facebook) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<meta property="fb:app_id"${attr("content", facebook.appId)}/>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (openGraph) {
        $$renderer3.push("<!--[-->");
        if (openGraph.url || canonical) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta property="og:url"${attr("content", openGraph.url || canonical)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.type) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta property="og:type"${attr("content", openGraph.type.toLowerCase())}/> `);
          if (openGraph.type.toLowerCase() === "profile" && openGraph.profile) {
            $$renderer3.push("<!--[-->");
            if (openGraph.profile.firstName) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="profile:first_name"${attr("content", openGraph.profile.firstName)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.profile.lastName) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="profile:last_name"${attr("content", openGraph.profile.lastName)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.profile.username) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="profile:username"${attr("content", openGraph.profile.username)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.profile.gender) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="profile:gender"${attr("content", openGraph.profile.gender)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          } else if (openGraph.type.toLowerCase() === "book" && openGraph.book) {
            $$renderer3.push("<!--[1-->");
            if (openGraph.book.authors && openGraph.book.authors.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(openGraph.book.authors);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let author = each_array_1[$$index_1];
                $$renderer3.push(`<meta property="book:author"${attr("content", author)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.book.isbn) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="book:isbn"${attr("content", openGraph.book.isbn)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.book.releaseDate) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="book:release_date"${attr("content", openGraph.book.releaseDate)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.book.tags && openGraph.book.tags.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_2 = ensure_array_like(openGraph.book.tags);
              for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
                let tag = each_array_2[$$index_2];
                $$renderer3.push(`<meta property="book:tag"${attr("content", tag)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          } else if (openGraph.type.toLowerCase() === "article" && openGraph.article) {
            $$renderer3.push("<!--[2-->");
            if (openGraph.article.publishedTime) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="article:published_time"${attr("content", openGraph.article.publishedTime)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.article.modifiedTime) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="article:modified_time"${attr("content", openGraph.article.modifiedTime)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.article.expirationTime) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="article:expiration_time"${attr("content", openGraph.article.expirationTime)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.article.authors && openGraph.article.authors.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_3 = ensure_array_like(openGraph.article.authors);
              for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                let author = each_array_3[$$index_3];
                $$renderer3.push(`<meta property="article:author"${attr("content", author)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.article.section) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="article:section"${attr("content", openGraph.article.section)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.article.tags && openGraph.article.tags.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_4 = ensure_array_like(openGraph.article.tags);
              for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
                let tag = each_array_4[$$index_4];
                $$renderer3.push(`<meta property="article:tag"${attr("content", tag)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          } else if (openGraph.type.toLowerCase() === "video.movie" || openGraph.type.toLowerCase() === "video.episode" || openGraph.type.toLowerCase() === "video.tv_show" || openGraph.type.toLowerCase() === "video.other" && openGraph.video) {
            $$renderer3.push("<!--[3-->");
            if (openGraph.video?.actors && openGraph.video.actors.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_5 = ensure_array_like(openGraph.video.actors);
              for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
                let actor = each_array_5[$$index_5];
                if (actor.profile) {
                  $$renderer3.push("<!--[-->");
                  $$renderer3.push(`<meta property="video:actor"${attr("content", actor.profile)}/>`);
                } else {
                  $$renderer3.push("<!--[!-->");
                }
                $$renderer3.push(`<!--]--> `);
                if (actor.role) {
                  $$renderer3.push("<!--[-->");
                  $$renderer3.push(`<meta property="video:actor:role"${attr("content", actor.role)}/>`);
                } else {
                  $$renderer3.push("<!--[!-->");
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.video?.directors && openGraph.video.directors.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_6 = ensure_array_like(openGraph.video.directors);
              for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
                let director = each_array_6[$$index_6];
                $$renderer3.push(`<meta property="video:director"${attr("content", director)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.video?.writers && openGraph.video.writers.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_7 = ensure_array_like(openGraph.video.writers);
              for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
                let writer = each_array_7[$$index_7];
                $$renderer3.push(`<meta property="video:writer"${attr("content", writer)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.video?.duration) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="video:duration"${attr("content", openGraph.video.duration.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.video?.releaseDate) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="video:release_date"${attr("content", openGraph.video.releaseDate)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.video?.tags && openGraph.video.tags.length) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_8 = ensure_array_like(openGraph.video.tags);
              for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
                let tag = each_array_8[$$index_8];
                $$renderer3.push(`<meta property="video:tag"${attr("content", tag)}/>`);
              }
              $$renderer3.push(`<!--]-->`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (openGraph.video?.series) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="video:series"${attr("content", openGraph.video.series)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.title || updatedTitle) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta property="og:title"${attr("content", openGraph.title || updatedTitle)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.description || description) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta property="og:description"${attr("content", openGraph.description || description)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.images && openGraph.images.length) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_9 = ensure_array_like(openGraph.images);
          for (let $$index_9 = 0, $$length = each_array_9.length; $$index_9 < $$length; $$index_9++) {
            let image = each_array_9[$$index_9];
            $$renderer3.push(`<meta property="og:image"${attr("content", image.url)}/> `);
            if (image.alt) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:image:alt"${attr("content", image.alt)}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (image.width) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:image:width"${attr("content", image.width.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (image.height) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:image:height"${attr("content", image.height.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (image.secureUrl) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:image:secure_url"${attr("content", image.secureUrl.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (image.type) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:image:type"${attr("content", image.type.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.videos && openGraph.videos.length) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_10 = ensure_array_like(openGraph.videos);
          for (let $$index_10 = 0, $$length = each_array_10.length; $$index_10 < $$length; $$index_10++) {
            let video = each_array_10[$$index_10];
            $$renderer3.push(`<meta property="og:video"${attr("content", video.url)}/> `);
            if (video.width) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:video:width"${attr("content", video.width.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (video.height) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:video:height"${attr("content", video.height.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (video.secureUrl) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:video:secure_url"${attr("content", video.secureUrl.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (video.type) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:video:type"${attr("content", video.type.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.audio && openGraph.audio.length) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_11 = ensure_array_like(openGraph.audio);
          for (let $$index_11 = 0, $$length = each_array_11.length; $$index_11 < $$length; $$index_11++) {
            let audio = each_array_11[$$index_11];
            $$renderer3.push(`<meta property="og:audio"${attr("content", audio.url)}/> `);
            if (audio.secureUrl) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:audio:secure_url"${attr("content", audio.secureUrl.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (audio.type) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<meta property="og:audio:type"${attr("content", audio.type.toString())}/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.locale) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta property="og:locale"${attr("content", openGraph.locale)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (openGraph.siteName) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<meta property="og:site_name"${attr("content", openGraph.siteName)}/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (additionalMetaTags && Array.isArray(additionalMetaTags)) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        const each_array_12 = ensure_array_like(additionalMetaTags);
        for (let $$index_12 = 0, $$length = each_array_12.length; $$index_12 < $$length; $$index_12++) {
          let tag = each_array_12[$$index_12];
          $$renderer3.push(`<meta${attributes({
            ...tag.httpEquiv ? { ...tag, "http-equiv": tag.httpEquiv } : tag
          })}/>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (additionalLinkTags?.length) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        const each_array_13 = ensure_array_like(additionalLinkTags);
        for (let $$index_13 = 0, $$length = each_array_13.length; $$index_13 < $$length; $$index_13++) {
          let tag = each_array_13[$$index_13];
          $$renderer3.push(`<link${attributes({ ...tag })} onload="this.__e=event" onerror="this.__e=event"/>`);
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]-->`);
    });
  });
}
function JsonLd($$renderer, $$props) {
  let { schema } = $$props;
  head("tpukq0", $$renderer, ($$renderer2) => {
    $$renderer2.push(`${html(`<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`)}`);
  });
}
function Hero($$renderer) {
  $$renderer.push(`<section class="relative overflow-hidden bg-gray-950 text-white"><div class="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-gray-950 to-indigo-950/30"></div> <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40 text-center"><h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">Your Personal AI Assistant <span class="block text-blue-400 mt-2">on Telegram</span></h1> <p class="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">Get your own AI assistant powered by Claude, running 24/7 on Telegram.
			Zero setup, fully managed. Just chat.</p> <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"><a href="/signup" class="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950 focus:ring-blue-500 transition-colors">Sign Up</a> <span class="text-gray-400 text-lg"><span class="text-white font-bold text-2xl">$20</span>/month</span></div> <p class="mt-4 text-sm text-gray-500">Bring your own Claude subscription. Cancel anytime.</p></div></section>`);
}
function HowItWorks($$renderer) {
  $$renderer.push(`<section class="py-20 sm:py-24 bg-white"><div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"><h2 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">How It Works</h2> <div class="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"><div class="text-center"><div class="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mb-5">1</div> <h3 class="text-xl font-semibold text-gray-900 mb-3">Sign Up</h3> <p class="text-gray-600 leading-relaxed">Create your account and subscribe. Takes less than a minute.</p></div> <div class="text-center"><div class="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mb-5">2</div> <h3 class="text-xl font-semibold text-gray-900 mb-3">Connect Telegram</h3> <p class="text-gray-600 leading-relaxed">Create a bot via BotFather and enter your token. We handle the rest.</p></div> <div class="text-center"><div class="w-14 h-14 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold mb-5">3</div> <h3 class="text-xl font-semibold text-gray-900 mb-3">Start Chatting</h3> <p class="text-gray-600 leading-relaxed">Your AI assistant is live in under 2 minutes. Open Telegram and say hello.</p></div></div></div></section>`);
}
function Features($$renderer) {
  $$renderer.push(`<section class="py-20 sm:py-24 bg-gray-50"><div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"><h2 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">Why Rachel Cloud</h2> <p class="text-center text-gray-600 mb-16 max-w-2xl mx-auto">Everything you need for a personal AI assistant, without the infrastructure headache.</p> <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"><div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"><div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.43-1.43a2.25 2.25 0 0 0-1.59-.659H8.02a2.25 2.25 0 0 0-1.59.659L5 14.5m14 0v3.25a2.25 2.25 0 0 1-2.25 2.25H7.25A2.25 2.25 0 0 1 5 17.75V14.5"></path></svg></div> <h3 class="text-lg font-semibold text-gray-900 mb-2">Powered by Claude</h3> <p class="text-gray-600 text-sm leading-relaxed">Your assistant runs on Anthropic's Claude -- one of the most capable AI models available.</p></div> <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"><div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"></path></svg></div> <h3 class="text-lg font-semibold text-gray-900 mb-2">24/7 on Telegram</h3> <p class="text-gray-600 text-sm leading-relaxed">Always available, responds in seconds. Your assistant never sleeps, never takes a break.</p></div> <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"><div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"></path></svg></div> <h3 class="text-lg font-semibold text-gray-900 mb-2">Dedicated Server</h3> <p class="text-gray-600 text-sm leading-relaxed">Your own VPS, not shared infrastructure. Full isolation and consistent performance.</p></div> <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"><div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"></path></svg></div> <h3 class="text-lg font-semibold text-gray-900 mb-2">Zero Setup</h3> <p class="text-gray-600 text-sm leading-relaxed">From signup to chatting in under 2 minutes. No terminal, no config files, no Docker.</p></div> <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"><div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"></path></svg></div> <h3 class="text-lg font-semibold text-gray-900 mb-2">Fully Managed</h3> <p class="text-gray-600 text-sm leading-relaxed">We handle updates, monitoring, and recovery. Your assistant stays online so you don't have to worry.</p></div> <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"><div class="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"></path></svg></div> <h3 class="text-lg font-semibold text-gray-900 mb-2">Bring Your Own Key</h3> <p class="text-gray-600 text-sm leading-relaxed">Uses your Claude subscription via OAuth. You control your AI spend, no hidden markup.</p></div></div></div></section>`);
}
function TelegramDemo($$renderer) {
  const messages = [
    {
      text: "What's on my calendar today?",
      sender: "user",
      time: "9:15 AM"
    },
    {
      text: "You have 3 things today:\n\n10:00 AM -- Team standup\n1:00 PM -- Lunch with Sarah\n4:00 PM -- Dentist appointment\n\nYour morning is free until standup.",
      sender: "rachel",
      time: "9:15 AM"
    },
    {
      text: "Remind me to call the dentist tomorrow at 10am",
      sender: "user",
      time: "9:16 AM"
    },
    {
      text: "Done! I'll remind you tomorrow (Wednesday) at 10:00 AM to call the dentist.",
      sender: "rachel",
      time: "9:16 AM"
    },
    {
      text: "What did we talk about last week?",
      sender: "user",
      time: "9:17 AM"
    },
    {
      text: "Last week we covered:\n\n-- Your trip planning for Portland in March\n-- The new project proposal you were drafting\n-- Setting up weekly meal prep reminders\n\nWant me to pull up details on any of these?",
      sender: "rachel",
      time: "9:17 AM"
    }
  ];
  $$renderer.push(`<section id="demo" class="py-20 sm:py-24 bg-gray-950 svelte-1tg7ops"><div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 svelte-1tg7ops"><h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-4 svelte-1tg7ops">See Rachel in Action</h2> <p class="text-center text-gray-400 mb-12 max-w-2xl mx-auto svelte-1tg7ops">This is what chatting with your personal AI assistant looks like -- right in Telegram.</p> <div class="max-w-sm mx-auto svelte-1tg7ops"><div class="rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 svelte-1tg7ops"><div class="bg-[#242F3D] px-4 py-3 flex items-center gap-3 svelte-1tg7ops"><div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold svelte-1tg7ops">R</div> <div class="flex-1 svelte-1tg7ops"><div class="font-semibold text-white text-sm svelte-1tg7ops">Rachel</div> <div class="text-xs text-blue-400 flex items-center gap-1 svelte-1tg7ops"><span class="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full svelte-1tg7ops"></span> online</div></div> <div class="flex items-center gap-3 text-gray-400 svelte-1tg7ops"><svg class="w-5 h-5 svelte-1tg7ops" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" class="svelte-1tg7ops"></path></svg> <svg class="w-5 h-5 svelte-1tg7ops" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" class="svelte-1tg7ops"></path></svg></div></div> <div class="px-3 py-4 space-y-2 bg-[#0E1621] min-h-[360px] svelte-1tg7ops"><!--[-->`);
  const each_array = ensure_array_like(messages);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let msg = each_array[$$index];
    $$renderer.push(`<div${attr_class(`flex ${stringify(msg.sender === "user" ? "justify-end" : "justify-start")}`, "svelte-1tg7ops")}><div${attr_class(
      `max-w-[80%] px-3 py-2 text-sm leading-relaxed ${stringify(msg.sender === "user" ? "bg-[#2B5278] text-white rounded-2xl rounded-br-sm" : "bg-[#182533] text-gray-100 rounded-2xl rounded-bl-sm")}`,
      "svelte-1tg7ops"
    )}><p class="whitespace-pre-line svelte-1tg7ops">${escape_html(msg.text)}</p> <p${attr_class(`text-[10px] mt-1 text-right ${stringify(msg.sender === "user" ? "text-blue-300/60" : "text-gray-500")}`, "svelte-1tg7ops")}>${escape_html(msg.time)}</p></div></div>`);
  }
  $$renderer.push(`<!--]--> <div class="flex justify-start svelte-1tg7ops"><div class="bg-[#182533] rounded-2xl rounded-bl-sm px-4 py-3 svelte-1tg7ops"><div class="flex items-center gap-1 svelte-1tg7ops"><span class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full svelte-1tg7ops"></span> <span class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full delay-150 svelte-1tg7ops"></span> <span class="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full delay-300 svelte-1tg7ops"></span></div></div></div></div> <div class="bg-[#17212B] px-3 py-2 flex items-center gap-2 border-t border-gray-700/30 svelte-1tg7ops"><svg class="w-6 h-6 text-gray-500 flex-shrink-0 svelte-1tg7ops" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" class="svelte-1tg7ops"></path></svg> <div class="flex-1 bg-[#242F3D] rounded-full px-4 py-2 text-sm text-gray-500 svelte-1tg7ops">Message</div> <svg class="w-6 h-6 text-gray-500 flex-shrink-0 svelte-1tg7ops" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" class="svelte-1tg7ops"></path></svg></div></div></div></div></section>`);
}
function Pricing($$renderer) {
  $$renderer.push(`<section class="py-20 sm:py-24 bg-white"><div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><h2 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">Simple Pricing</h2> <p class="text-center text-gray-600 mb-16 max-w-xl mx-auto">One plan. Everything included. No surprises.</p> <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 sm:p-10 border-2 border-blue-200 max-w-lg mx-auto"><div class="text-center"><h3 class="text-2xl font-bold text-gray-900 mb-6">Rachel Cloud</h3> <div class="mb-8"><span class="text-5xl font-extrabold text-blue-600">$20</span> <span class="text-xl text-gray-600">/month</span></div> <ul class="text-left space-y-4 mb-10"><li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Your own Telegram bot connected to Claude</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Dedicated VPS instance</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Fully managed and monitored 24/7</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Auto-updates included</span></li> <li class="flex items-start"><svg class="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span class="text-gray-700">Cancel anytime</span></li></ul> <a href="/signup" class="inline-flex items-center justify-center w-full px-8 py-4 text-lg font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Get Started</a> <p class="mt-4 text-sm text-gray-500">Cancel anytime with a 3-day grace period</p></div></div></div></section>`);
}
function OpenSource($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<section class="py-20 sm:py-24 bg-gray-900 text-white"><div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8"><h2 class="text-3xl sm:text-4xl font-bold mb-4">Open Source</h2> <p class="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">Rachel is fully open source. Self-host it on your own server, or let us handle everything
			with Rachel Cloud.</p> <div class="flex flex-col sm:flex-row items-center justify-center gap-6"><a class="github-button" href="https://github.com/polly3223/Rachel8" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star polly3223/Rachel8 on GitHub">Star</a> <a href="https://github.com/polly3223/Rachel8" class="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer"><svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg> View on GitHub</a></div></div></section>`);
  });
}
function FAQ($$renderer) {
  const faqs = [
    {
      question: "What do I need to get started?",
      answer: "A Claude subscription (Max or Team plan) and a Telegram account. Rachel Cloud handles everything else -- server setup, deployment, and monitoring."
    },
    {
      question: "Do I need my own Claude API key?",
      answer: "No. You connect your existing Claude account via OAuth. No API key needed -- just authorize with your Anthropic account and you're set."
    },
    {
      question: "What can Rachel do?",
      answer: "Anything Claude can do: answer questions, write and review code, summarize content, search the web, read files, manage scheduled tasks, and more -- all via Telegram. Rachel also has persistent memory so she remembers your preferences and past conversations."
    },
    {
      question: "What happens if my instance goes down?",
      answer: "We monitor all instances 24/7 and auto-restart them if anything goes wrong. Your assistant stays online so you don't have to think about it."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes. Cancel anytime with a 3-day grace period. No long-term contracts, no cancellation fees."
    },
    {
      question: "Is Rachel open source?",
      answer: "Yes! Rachel is fully open source on GitHub. You can self-host it on your own server for free, or let Rachel Cloud handle all the infrastructure for $20/month."
    }
  ];
  let openIndex = null;
  $$renderer.push(`<section class="py-20 sm:py-24 bg-gray-50"><div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"><h2 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16">Frequently Asked Questions</h2> <div class="space-y-4"><!--[-->`);
  const each_array = ensure_array_like(faqs);
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let faq = each_array[i];
    $$renderer.push(`<div class="bg-white rounded-xl border border-gray-200 overflow-hidden"><button class="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"${attr("aria-expanded", openIndex === i)}><span class="text-lg font-medium text-gray-900">${escape_html(faq.question)}</span> <svg${attr_class(`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${stringify(openIndex === i ? "rotate-180" : "")}`)} fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"></path></svg></button> `);
    if (openIndex === i) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<div class="px-6 pb-5"><p class="text-gray-600 leading-relaxed">${escape_html(faq.answer)}</p></div>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--></div>`);
  }
  $$renderer.push(`<!--]--></div></div></section>`);
}
function Footer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<footer class="bg-gray-100 border-t border-gray-200"><div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div class="flex flex-col sm:flex-row items-center justify-between gap-6"><div class="text-center sm:text-left"><span class="text-lg font-bold text-gray-900">Rachel Cloud</span> <p class="text-sm text-gray-500 mt-1">Your personal AI assistant on Telegram</p></div> <nav class="flex items-center gap-6"><a href="/signup" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign Up</a> <a href="/login" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Login</a> <a href="https://github.com/polly3223/Rachel8" class="text-sm text-gray-600 hover:text-gray-900 transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a></nav></div> <div class="mt-8 pt-6 border-t border-gray-200 text-center"><p class="text-sm text-gray-400">© ${escape_html((/* @__PURE__ */ new Date()).getFullYear())} Rachel Cloud. All rights reserved.</p></div></div></footer>`);
  });
}
function _page($$renderer) {
  const title = "Rachel Cloud - Your Personal AI Assistant on Telegram";
  const description = "Get your own AI assistant powered by Claude, running 24/7 on Telegram. Managed hosting, zero setup. $20/month.";
  const canonicalUrl = "https://rachelcloud.com";
  const ogImageUrl = `${canonicalUrl}/og-image.png`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Rachel Cloud",
    applicationCategory: "CommunicationApplication",
    operatingSystem: "Web",
    description: "Personal AI assistant powered by Claude, running 24/7 on Telegram. Managed hosting, zero setup.",
    offers: { "@type": "Offer", price: "20.00", priceCurrency: "USD" },
    url: canonicalUrl
  };
  MetaTags($$renderer, {
    title,
    description,
    canonical: canonicalUrl,
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Rachel Cloud - AI Assistant on Telegram"
        }
      ],
      siteName: "Rachel Cloud"
    },
    twitter: {
      cardType: "summary_large_image",
      title,
      description: "Your personal AI assistant on Telegram, powered by Claude. Deploy in under 2 minutes.",
      image: ogImageUrl
    }
  });
  $$renderer.push(`<!----> `);
  JsonLd($$renderer, { schema: jsonLd });
  $$renderer.push(`<!----> <main>`);
  Hero($$renderer);
  $$renderer.push(`<!----> `);
  HowItWorks($$renderer);
  $$renderer.push(`<!----> `);
  Features($$renderer);
  $$renderer.push(`<!----> `);
  TelegramDemo($$renderer);
  $$renderer.push(`<!----> `);
  Pricing($$renderer);
  $$renderer.push(`<!----> `);
  OpenSource($$renderer);
  $$renderer.push(`<!----> `);
  FAQ($$renderer);
  $$renderer.push(`<!----></main> `);
  Footer($$renderer);
  $$renderer.push(`<!---->`);
}
export {
  _page as default
};
