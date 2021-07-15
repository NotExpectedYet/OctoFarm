export function returnPluginListTemplate(plugin) {
  //Also need check inplace for incompatible...
  let abandoned = "";
  if (plugin.abandoned === true) {
    abandoned = '<i class="fa fa-heartbeat" title="Abandoned by its maintainer"></i>';
  }
  let latestRelease = "";
  if (plugin?.github?.latest_release) {
    latestRelease = `
    <small class="prop" title="Github stars"><i class="fa fa-star"></i> <span >${plugin.github.stars}</span></small>
    <small class="prop" title="Last push to main branch"><i class="fa fa-refresh"></i> <span>${plugin.github.stars}</span></small>
    <small class="prop" title="Latest release &amp; date"><i class="fa fa-tag"></i> <span >${plugin.github.latest_release.tag}</span> (<span >${plugin.github.latest_release.date}</span>)</small>`;
  }

  return `
      <div class="entry" id="plugin-${plugin.title.replace(/ /g, "_")}">
                        <div class="row-fluid">
                            <div class="span12">
                                <div>
                                    <span>${plugin.title}</span>

                                    ${abandoned}
                           
                                </div>
                                <div class="meta">
                                    <small class="prop">
                                      <i class="fa fa-info"></i>
                                      &nbsp;<a target="_blank" href="${plugin.page}" title="${
    plugin.page
  }">
                                      Details
                                      </a>
                                    </small>
                                    <small class="prop">
                                        <i class="fa fa-home"></i>
                                        &nbsp;<a target="_blank" href="${plugin.homepage}" title="${
    plugin.homepage
  }">
                                        Homepage
                                        </a>
                                      </small>
                                    <small class="prop"><i class="fa fa-user"></i> <span title="${
                                      plugin.author
                                    }">${plugin.author}</span></small>
                                </div>
                                <div class="muted"><small>${plugin.description}</small></div>
                                <div class="stats">
                                    <small class="prop" title="License"><i class="fa fa-gavel"></i> <span>${
                                      plugin.license
                                    }</span></small>
                                    <small class="prop" title="Publication date"><i class="fa fa-birthday-cake"></i> <span>${JSON.stringify(
                                      plugin.published
                                    ).substring(1, 11)}</span></small>
                                    <small class="prop" title="Active instances past month"><i class="fa fa-server"></i> <span >${JSON.stringify(
                                      plugin.stats.instances_month
                                    ).substring(0, 11)}</span></small>
                                    ${latestRelease}
                                </div>
                            </div>

                        </div>
                    </div>
  `;
}
