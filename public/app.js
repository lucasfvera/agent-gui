let currentRoot = null;
let currentGroups = null;
let currentSkillsCache = {};
let isLoading = false;

async function loadRoots() {
  const res = await fetch('/api/roots');
  const roots = await res.json();

  const list = document.getElementById('rootsList');
  list.innerHTML = roots.map(root => `
    <div class="root-item ${root.skillCount === 0 ? 'disabled' : ''}"
         data-name="${root.name}"
         data-has-groups="${root.hasGroups || false}"
         ${root.skillCount === 0 ? '' : `onclick="selectRoot('${root.name}')"`}>
      <span class="name">${root.name}</span>
      <span class="count">${root.skillCount}</span>
    </div>
  `).join('');
}

async function selectRoot(rootName) {
  if (isLoading) return;
  isLoading = true;

  document.getElementById('contentBody').innerHTML = '<div class="empty-state">Loading...</div>';

  document.querySelectorAll('.root-item').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-name="${rootName}"]`).classList.add('active');

  currentRoot = rootName;
  currentSkillsCache = {};
  document.getElementById('rootTitle').textContent = rootName;

  const isCursor = rootName === '.cursor';

  if (isCursor) {
    const groupsRes = await fetch(`/api/groups/${rootName}`);
    const groups = await groupsRes.json();
    currentGroups = groups;

    document.getElementById('rootSubtitle').textContent = `${groups.length} group${groups.length !== 1 ? 's' : ''}`;

    if (groups.length === 0) {
      document.getElementById('contentBody').innerHTML = `
        <div class="empty-state">No skill groups found in ${rootName}</div>
      `;
      return;
    }

    const groupsHtml = groups.map((group, groupIndex) => `
      <div class="accordion group-accordion" data-group-index="${groupIndex}">
        <div class="accordion-header" onclick="toggleGroup(${groupIndex})">
          <span class="arrow">▶</span>
          <div class="info">
            <div class="skill-name">${group.name}</div>
            <div class="skill-count">${group.skillCount} skills</div>
          </div>
        </div>
        <div class="accordion-content" id="group-content-${groupIndex}">
          <div class="group-skills-placeholder">Loading...</div>
        </div>
      </div>
    `).join('');

    document.getElementById('contentBody').innerHTML = groupsHtml;
  } else {
    const res = await fetch(`/api/skills?root=${rootName}`);
    const skills = await res.json();

    document.getElementById('rootSubtitle').textContent = `${skills.length} skill${skills.length !== 1 ? 's' : ''}`;

    if (skills.length === 0) {
      document.getElementById('contentBody').innerHTML = `
        <div class="empty-state">No skills found in ${rootName}</div>
      `;
      return;
    }

    currentSkillsCache['flat'] = skills;

    const listHtml = skills.map((skill, index) => `
      <div class="accordion" data-index="flat-${index}">
        <div class="accordion-header" onclick="toggleSkill('flat', ${index})">
          <span class="arrow">▶</span>
          <div class="info">
            <div class="skill-name">${skill.name}</div>
            <div class="skill-path">${skill.path}</div>
          </div>
          <label class="toggle-switch" onclick="event.stopPropagation()">
            <input type="checkbox" ${skill.enabled ? 'checked' : ''} 
                   onchange="toggleSkillEnabled('flat', ${index}, ${skill.enabled})">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="accordion-content">
          <div class="skill-description">${escapeHtml(skill.description)}</div>
          <div class="skill-content" id="content-flat-${index}"></div>
        </div>
      </div>
    `).join('');

    document.getElementById('contentBody').innerHTML = listHtml;
  }
  isLoading = false;
}

async function toggleGroup(groupIndex) {
  const groupAccordion = document.querySelector(`[data-group-index="${groupIndex}"]`);
  const isOpen = groupAccordion.classList.contains('open');

  if (isOpen) {
    groupAccordion.classList.remove('open');
  } else {
    groupAccordion.classList.add('open');

    const contentDiv = document.getElementById(`group-content-${groupIndex}`);
    const placeholder = contentDiv.querySelector('.group-skills-placeholder');

    if (placeholder) {
      const group = currentGroups[groupIndex];
      const skillsRes = await fetch(`/api/skills?root=${currentRoot}&group=${group.path}`);
      const skills = await skillsRes.json();

      currentSkillsCache[`group-${groupIndex}`] = skills;

      const skillsHtml = skills.map((skill, skillIndex) => `
        <div class="accordion inner-accordion" data-index="group-${groupIndex}-${skillIndex}">
          <div class="accordion-header" onclick="toggleSkill('group-${groupIndex}', ${skillIndex})">
            <span class="arrow">▶</span>
            <div class="info">
              <div class="skill-name">${skill.name}</div>
              <div class="skill-path">${skill.path}</div>
            </div>
            <label class="toggle-switch" onclick="event.stopPropagation()">
              <input type="checkbox" ${skill.enabled ? 'checked' : ''} 
                     onchange="toggleSkillEnabled('group-${groupIndex}', ${skillIndex}, ${skill.enabled})">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="accordion-content">
            <div class="skill-description">${escapeHtml(skill.description)}</div>
            <div class="skill-content" id="content-group-${groupIndex}-${skillIndex}"></div>
          </div>
        </div>
      `).join('');

      contentDiv.innerHTML = skillsHtml || '<div class="empty-state" style="padding: 16px;">No skills in this group</div>';
    }
  }
}

async function toggleSkill(cacheKey, index) {
  const accordion = document.querySelector(`[data-index="${cacheKey}-${index}"]`);
  const isOpen = accordion.classList.contains('open');

  if (isOpen) {
    accordion.classList.remove('open');
  } else {
    accordion.classList.add('open');

    const contentDiv = document.getElementById(`content-${cacheKey}-${index}`);
    if (contentDiv.innerHTML === '') {
      const skills = currentSkillsCache[cacheKey];
      const skill = skills[index];

      if (skill) {
        let groupParam = '';
        if (currentRoot === '.cursor' && cacheKey.startsWith('group-')) {
          const groupIndex = cacheKey.split('-')[1];
          if (currentGroups && currentGroups[groupIndex]) {
            groupParam = `?group=${encodeURIComponent(currentGroups[groupIndex].path)}`;
          }
        }
        const res = await fetch(`/api/skill/${currentRoot}/${skill.path}${groupParam}`);
        const skillData = await res.json();

        if (skillData) {
          let html = `<pre>${escapeHtml(skillData.content)}</pre>`;

          if (skillData.references && skillData.references.length > 0) {
            html += `
              <div class="references-list">
                <h3 style="margin: 16px 0 8px; font-size: 14px;">References</h3>
                ${skillData.references.map(ref => `
                  <div class="reference-item">
                    <h4>${ref.name}</h4>
                    <pre>${escapeHtml(ref.content)}</pre>
                  </div>
                `).join('')}
              </div>
            `;
          }

          contentDiv.innerHTML = html;
        }
      }
    }
  }
}

async function toggleSkillEnabled(cacheKey, index, currentEnabled) {
  event.stopPropagation();

  const skills = currentSkillsCache[cacheKey];
  const skill = skills[index];

  if (!skill) return;

  const groupPath = getGroupPath(cacheKey);
  const fullPath = groupPath ? `${groupPath}/${skill.path}` : skill.path;
  const groupParam = groupPath ? `?group=${encodeURIComponent(groupPath)}` : '';

  try {
    const res = await fetch(`/api/skill/toggle/${currentRoot}/${fullPath}${groupParam}`, {
      method: 'POST'
    });
    const result = await res.json();

    if (result.success) {
      skill.enabled = result.enabled;
      const checkbox = document.querySelector(`[data-index="${cacheKey}-${index}"] input[type="checkbox"]`);
      if (checkbox) {
        checkbox.checked = result.enabled;
      }
    } else {
      console.error('Failed to toggle skill:', result.error);
    }
  } catch (e) {
    console.error('Error toggling skill:', e);
  }
}

function getGroupPath(cacheKey) {
  if (currentRoot === '.cursor' && cacheKey.startsWith('group-')) {
    const groupIndex = cacheKey.split('-')[1];
    if (currentGroups && currentGroups[groupIndex]) {
      return currentGroups[groupIndex].path;
    }
  }
  return '';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

loadRoots();