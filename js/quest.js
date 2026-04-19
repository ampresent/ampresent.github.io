/**
 * quest.js — Quest tracking and progression system
 */
const QuestSystem = (() => {
  const quests = [];
  const completedQuests = [];

  function init() {
    addQuest({
      id: 'first_steps',
      title: '🧱 初入泥灵界',
      description: '学会泥灵界的基本操作',
      objectives: [
        { id: 'talk_elder', text: '与泥爷爷交谈', done: false },
        { id: 'harvest_clay', text: '采集黏土矿 (按 E)', done: false },
        { id: 'cast_spell', text: '释放一个魔法 (左键)', done: false },
      ],
      reward: '解锁工坊',
    });

    addQuest({
      id: 'first_assistant',
      title: '✨ 第一个助手',
      description: '创造属于你的第一个黏土助手',
      objectives: [
        { id: 'open_workshop', text: '打开工坊 (Tab)', done: false },
        { id: 'collect_10_clay', text: '收集 10 单位黏土', done: false },
        { id: 'craft_assistant', text: '创造一个助手', done: false },
      ],
      reward: '助手跟随系统',
      locked: true,
    });

    addQuest({
      id: 'meet_scholar',
      title: '🔬 黏土学徒',
      description: '拜访瓷小姐，了解黏土的秘密',
      objectives: [
        { id: 'talk_scholar', text: '与瓷小姐交谈', done: false },
        { id: 'find_rare_clay', text: '找到一块稀有黏土', done: false },
      ],
      reward: '高级配方解锁',
      locked: true,
    });

    addQuest({
      id: 'four_elements',
      title: '🌀 四象之力',
      description: '创造所有四种属性的助手',
      objectives: [
        { id: 'fire_assistant', text: '创造火灵助手', done: false },
        { id: 'water_assistant', text: '创造水灵助手', done: false },
        { id: 'wind_assistant', text: '创造风灵助手', done: false },
        { id: 'life_assistant', text: '创造绿灵助手', done: false },
      ],
      reward: '解锁远古黏土巨人副本',
      locked: true,
    });

    addQuest({
      id: 'ancient_giant',
      title: '🗿 远古黏土巨人',
      description: '收集四种魔法黏土，唤醒沉睡的巨人',
      objectives: [
        { id: 'fire_clay', text: '获取火焰黏土', done: false },
        { id: 'water_clay', text: '获取水流黏土', done: false },
        { id: 'wind_clay', text: '获取风暴黏土', done: false },
        { id: 'life_clay', text: '获取生命黏土', done: false },
        { id: 'awaken_giant', text: '在祭坛唤醒巨人', done: false },
      ],
      reward: '???',
      locked: true,
    });
  }

  function addQuest(quest) {
    quest.status = quest.locked ? 'locked' : 'active';
    quests.push(quest);
  }

  function completeObjective(questId, objectiveId) {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'active') return;

    const obj = quest.objectives.find(o => o.id === objectiveId);
    if (!obj || obj.done) return;

    obj.done = true;
    UI.notify(`✅ ${obj.text}`);

    // Check if all objectives done
    if (quest.objectives.every(o => o.done)) {
      quest.status = 'completed';
      completedQuests.push(quest);
      QuestAnim.celebrate(quest.title);

      // Unlock next quests
      unlockNextQuests(quest.id);
    }

    updateQuestPanel();
  }

  function unlockNextQuests(completedId) {
    const unlockMap = {
      'first_steps': ['first_assistant'],
      'first_assistant': ['meet_scholar'],
      'meet_scholar': ['four_elements'],
      'four_elements': ['ancient_giant'],
    };

    const toUnlock = unlockMap[completedId] || [];
    toUnlock.forEach(id => {
      const quest = quests.find(q => q.id === id);
      if (quest && quest.status === 'locked') {
        quest.status = 'active';
        UI.notify(`📋 新任务: ${quest.title}`);
      }
    });
  }

  function getActiveQuests() {
    return quests.filter(q => q.status === 'active');
  }

  function getAllQuests() {
    return quests;
  }

  function updateQuestPanel() {
    // Quest panel is rendered on demand by toggle
  }

  return {
    init, completeObjective, getActiveQuests, getAllQuests,
  };
})();
