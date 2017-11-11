const db = require('sqlite')


function parseEFT(str) {
  const eft = str.split('\n')
  const items = []

  // Parse ship line
  let shipline = eft.shift()
  shipline = shipline.replace('[', '')
  shipline = shipline.replace(']', '')
  shipline = shipline.split(/, */)
  const shipname = shipline[0]
  const fitname  = shipline[1]
  items.push(shipname)

  for (let line of eft) {
    // Skip or Modify line
    line = line.replace(/^\[empty \w+ slot\]$/, '')
    line = line.replace(/ x\d+$/, '')
    if (line == '') continue
    const parts = line.split(',')
    const itemname = parts[0]
    items.push(itemname)
  }

  return items
}


async function getRequiredSkills(itemname) {
  await db.open('../latest.sqlite', { cached: true })
  const SQL = `
SELECT
Types.typeID as typeID,
Types.typeName as typeName,
IFNULL(SkillID.valueInt, CAST(SkillID.valueFloat AS INT)) as requiredSkillID,
IFNULL(SkillLevel.valueInt, CAST(SkillLevel.valueFloat AS INT)) as requiredSkillLevel
FROM invtypes as Types
INNER JOIN dgmtypeattributes as SkillID
ON Types.typeID = SkillID.typeID AND SkillID.attributeID in (182,183,184,1285,1289,1290)
INNER JOIN dgmtypeattributes as SkillLevel
ON Types.typeID = SkillLevel.typeID AND (
   (SkillID.attributeID = 182 AND SkillLevel.attributeID = 277) OR
   (SkillID.attributeID = 183 AND SkillLevel.attributeID = 278) OR
   (SkillID.attributeID = 184 AND SkillLevel.attributeID = 279) OR
   (SkillID.attributeID = 1285 AND SkillLevel.attributeID = 1286) OR
   (SkillID.attributeID = 1289 AND SkillLevel.attributeID = 1287) OR
   (SkillID.attributeID = 1290 AND SkillLevel.attributeID = 1288) )
WHERE typeName = ?`  // Types.published = 1
  return await db.all(SQL, itemname)
}


async function examine(skills, eft) {
  const items = parseEFT(eft)
  const required = {}
  for (const itemname of items) {
    const rows = await getRequiredSkills(itemname)
    for (const {requiredSkillID: rsId, requiredSkillLevel: rsLv} of rows) {
      if ((skills[rsId] || 0) < rsLv && (required[rsId] || 0) < rsLv)
        required[rsId] = rsLv
    }
  }
  return required
}

module.exports = examine