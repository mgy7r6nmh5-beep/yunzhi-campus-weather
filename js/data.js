const LOCATIONS = [
  {
    id: 'east_field', name: '东苑运动场', icon: 'i-field', kind: 'campus',
    lat: 32.2056, lon: 118.7179,
    factors: { wind: 1.0, sun: 1.18, slip: 1.15 },
    tags: ['开阔', '无遮挡', '跑道'],
    tips: {
      base: '场地开阔，适合跑步与球类活动，注意补充水分',
      rain: '跑道与场内草皮雨后积水，急停变向容易打滑',
      wind: '场地四周无遮挡，阵风对羽毛球、风筝影响明显',
      hot: '午后跑道地表升温快，建议避开正午时段'
    }
  },
  {
    id: 'motto_square', name: '校训广场', icon: 'i-square', kind: 'campus',
    lat: 32.2063, lon: 118.7161,
    factors: { wind: 1.05, sun: 1.25, slip: 1.02 },
    tags: ['无遮挡', '石阶'],
    tips: {
      base: '广场人流集中，通行注意礼让，石阶边缘留意脚下',
      rain: '石阶与地砖雨后湿滑，上下台阶放慢',
      wind: '广场无遮挡，风感比楼间通道更直接',
      hot: '正午暴晒明显，建议走两侧林荫或连廊'
    }
  },
  {
    id: 'wende', name: '文德楼', icon: 'i-building', kind: 'campus',
    lat: 32.2071, lon: 118.7183,
    factors: { wind: 0.9, sun: 0.8, slip: 1.0 },
    tags: ['教学楼', '连廊'],
    tips: {
      base: '楼内连廊可避雨，出楼前先看天空再决定路线',
      rain: '连廊可挡雨，但出楼后到下一栋楼之间仍有暴露段',
      wind: '楼体遮挡明显，楼下体感比广场温和',
      hot: '楼间通道与树荫较多，短时通行影响较小'
    }
  },
  {
    id: 'meteorology', name: '气象楼', icon: 'i-building', kind: 'campus',
    lat: 32.2085, lon: 118.7154,
    factors: { wind: 1.3, sun: 0.9, slip: 1.0 },
    tags: ['楼高', '狭管效应'],
    tips: {
      base: '楼前平台视野开阔，适合观云与拍摄天空',
      rain: '楼间通道遇雨易形成积水线，横穿时注意车辆',
      wind: '楼间通道有狭管效应，风感明显强于周边区域',
      hot: '楼体遮阴较多，午后西侧仍有较强直射'
    }
  },
  {
    id: 'qunying_river', name: '群英河步道', icon: 'i-river', kind: 'campus',
    lat: 32.2069, lon: 118.7136,
    factors: { wind: 0.95, sun: 0.95, slip: 1.35 },
    tags: ['临水', '砖面'],
    tips: {
      base: '临水步道适合散步，靠近水边注意护栏与湿滑区',
      rain: '步道临水，砖面雨后湿滑，靠外侧行走',
      wind: '河道两侧风道通畅，逆风行走体感更明显',
      hot: '树荫覆盖较好，但水汽重时体感偏闷'
    }
  },
  {
    id: 'library', name: '图书馆', icon: 'i-book', kind: 'campus',
    lat: 32.2078, lon: 118.7172,
    factors: { wind: 0.85, sun: 0.75, slip: 1.0 },
    tags: ['室内', '长时段'],
    tips: {
      base: '馆前台阶平整，进出注意人流高峰',
      rain: '馆前台阶与门厅湿滑，收伞后再进闸机',
      wind: '馆体遮挡明显，入口处风感很小',
      hot: '馆内凉爽，进出温差较大时注意适应'
    }
  },
  {
    id: 'student_center', name: '大学生活动中心', icon: 'i-building', kind: 'campus',
    lat: 32.2066, lon: 118.7194,
    factors: { wind: 0.95, sun: 0.9, slip: 1.02 },
    tags: ['活动', '台阶'],
    tips: {
      base: '活动前后人流集中，门口台阶注意避让',
      rain: '门口台阶遇雨湿滑，活动散场时尤其注意',
      wind: '建筑转角处有短暂强风，轻质展架需固定',
      hot: '门外广场午后偏晒，排队时尽量站阴凉处'
    }
  },
  {
    id: 'gym', name: '体育馆', icon: 'i-dome', kind: 'campus',
    lat: 32.2091, lon: 118.7186,
    factors: { wind: 1.02, sun: 1.0, slip: 1.0 },
    tags: ['室内', '场馆'],
    tips: {
      base: '馆前空地常作热身区，注意进出车辆',
      rain: '馆前地面排水较快，但入口雨棚下容易积水',
      wind: '馆体较高，迎风侧风感明显',
      hot: '馆内凉爽，建议提前到场避免门外暴晒等候'
    }
  },
  {
    id: 'pool', name: '游泳馆', icon: 'i-wave', kind: 'campus',
    lat: 32.2094, lon: 118.7199,
    factors: { wind: 1.0, sun: 1.0, slip: 1.25 },
    tags: ['室内', '湿区'],
    tips: {
      base: '馆内外温差与湿度差异大，进出注意保暖',
      rain: '入口地垫易湿，穿行时放慢脚步',
      wind: '馆前空地风感一般，注意湿发受风',
      hot: '午后馆外闷热，出水后注意补水'
    }
  },
  {
    id: 'west_canteen', name: '西苑食堂', icon: 'i-bowl', kind: 'campus',
    lat: 32.2049, lon: 118.7126,
    factors: { wind: 0.92, sun: 0.85, slip: 1.1 },
    tags: ['就餐', '人流'],
    tips: {
      base: '饭点人流密集，入口排队注意秩序',
      rain: '门口地砖遇雨湿滑，收伞时留意脚下',
      wind: '食堂前风感较弱，但雨棚边缘会滴水',
      hot: '排队区域无遮挡，正午等候时间尽量缩短'
    }
  },
  {
    id: 'south_gate', name: '南门', icon: 'i-gate', kind: 'campus',
    lat: 32.2039, lon: 118.7162,
    factors: { wind: 1.1, sun: 1.05, slip: 1.0 },
    tags: ['出入口', '车流'],
    tips: {
      base: '校门车流集中，过街走人行横道',
      rain: '门口路面排水一般，过街注意车辆溅水',
      wind: '门口开阔，风感比其他校门更明显',
      hot: '门区地面反射强，等车时尽量站树荫下'
    }
  },
  {
    id: 'north_gate', name: '北门', icon: 'i-gate', kind: 'campus',
    lat: 32.2101, lon: 118.7159,
    factors: { wind: 1.08, sun: 1.02, slip: 1.0 },
    tags: ['出入口', '车流'],
    tips: {
      base: '北门临主干道，进出注意信号灯',
      rain: '门区路面遇雨反光，骑行减速通过',
      wind: '门区风口明显，骑行时注意侧风',
      hot: '等候区遮阴有限，建议缩短停留'
    }
  },
  {
    id: 'longwang_hill', name: '龙王山', icon: 'i-hill', kind: 'campus',
    lat: 32.2112, lon: 118.7224,
    factors: { wind: 1.15, sun: 1.1, slip: 1.2 },
    tags: ['坡地', '林间'],
    tips: {
      base: '坡道与林间小径交错，结伴活动更稳妥',
      rain: '林间土路与石阶雨后湿滑，下坡尤其注意',
      wind: '山脊与坡口风感明显，林内相对和缓',
      hot: '林内凉爽但闷，坡道心率上升快'
    }
  },
  {
    id: 'changwang', name: '长望楼', icon: 'i-building', kind: 'campus',
    lat: 32.2080, lon: 118.7145,
    factors: { wind: 0.95, sun: 0.85, slip: 1.0 },
    tags: ['实验楼', '连廊'],
    tips: {
      base: '楼前通道连接教学区，课间人流集中',
      rain: '连廊可避雨，出口到食堂一段需撑伞',
      wind: '楼间通道有持续性穿堂风',
      hot: '楼体遮阴较好，少量路段仍有直射'
    }
  },
  {
    id: 'laoshan_trail', name: '老山徒步', icon: 'i-trail', kind: 'trail',
    lat: 32.1780, lon: 118.6520,
    factors: { wind: 1.2, sun: 1.05, slip: 1.4 },
    tags: ['校外', '山林'],
    tips: {
      base: '山路段无补给，出发前备足饮水与照明',
      rain: '石阶与土坡雨后湿滑，下撤比上山更需谨慎',
      wind: '山脊段风大，帽檐与雨衣注意固定',
      hot: '林间闷热且无遮阴缺口，注意电解质补充'
    }
  },
  {
    id: 'riverside_ride', name: '沿江骑行', icon: 'i-ride', kind: 'trail',
    lat: 32.1900, lon: 118.7250,
    factors: { wind: 1.15, sun: 1.05, slip: 1.1 },
    tags: ['校外', '骑行'],
    tips: {
      base: '沿江道路车流与行人混行，控制车速',
      rain: '路面遇水反光，刹车距离变长，降低巡航速度',
      wind: '江面横风明显，逆风段消耗体力更多',
      hot: '江边遮阴稀少，长途骑行注意防晒与补水'
    }
  }
];

const INTENTS = [
  { id: 'outdoor', name: '户外运动', hint: '跑步、球类、骑行' },
  { id: 'commute', name: '上课通勤', hint: '往返教室与宿舍' },
  { id: 'dry', name: '晾晒衣物', hint: '阳台、操场晒被' }
];

const CLOUD_TYPES = [
  {
    id: 'cumulus', name: '积云',
    height: '云底约在楼顶两三层高，可对照远处楼房层数',
    light: '顺光面明亮、背光面偏灰，侧向测光更易看出体积',
    form: '团块状、边缘清晰，底部相对平坦',
    tags: ['积云', '对流'],
    note: ['体量感强，适合记录云底位置与阴影关系', '由上升气流形成，常出现在晴热午后']
  },
  {
    id: 'cumulonimbus', name: '积雨云',
    height: '云底低而厚，常压过气象楼顶，远端已连成一片',
    light: '顶部受光、底部暗沉，明暗交界线明显',
    form: '垂直发展成塔状，顶部外展成砧状，底部颜色深',
    tags: ['积雨云', '雷暴'],
    note: ['常伴随雷阵雨与阵风，记录时优先写下时间与移动方向', '发展快，同一位置隔十几分钟再看一次变化明显']
  },
  {
    id: 'stratus', name: '层云',
    height: '云底贴近楼顶与树梢，抬头近乎整片灰幕',
    light: '全天空均匀散射，几乎看不出光照方向',
    form: '均匀灰幕，无清晰轮廓，边缘与雾相接',
    tags: ['层云', '低云'],
    note: ['常带来毛毛雨或低能见度，适合记录湿度与视线', '与雾的区别在于是否抬升离开地面']
  },
  {
    id: 'stratocumulus', name: '层积云',
    height: '云底在楼宇上层，成片铺开但保留间隙',
    light: '云隙透出条带状亮光，地面光斑随云移动',
    form: '团块成片、有明显间隙，边缘柔和',
    tags: ['层积云', '云隙'],
    note: ['云隙透光变化快，适合连续记录地面光斑', '常见于天气转变前后，可对照气压与风向']
  },
  {
    id: 'altocumulus', name: '高积云',
    height: '云底较高，约数倍楼高，需仰角观察',
    light: '云边银亮，逆光时轮廓更清晰',
    form: '鱼鳞或瓦片状成排排列，个体较小而密集',
    tags: ['高积云', '鱼鳞'],
    note: ['成排的云街能反映高空气流方向', '与卷积云相比个体更大、排列更松散']
  },
  {
    id: 'cirrus', name: '卷云',
    height: '位置很高，远高于楼顶，常见于晴空背景',
    light: '透光性强，逆光时呈现丝缕状亮线',
    form: '丝缕状、羽状或钩状，边缘发散不闭合',
    tags: ['卷云', '高云'],
    note: ['由冰晶组成，形状随风切变拉伸', '常出现在天气系统前部，可对照后续云量变化']
  }
];

const NOTE_STYLES = [
  { id: 'brief', name: '简洁记录' },
  { id: 'study', name: '科普说明' },
  { id: 'life', name: '生活化' }
];

const PHOTO_CLICHE = ['绝美', '大片', '氛围感', '刷爆', '出片', '构图', '滤镜', '史诗感', '梦境', '治愈系'];

const IMAGE_CREDITS = {
  source: 'open-meteo 实时气象接口',
  model: '本地规则引擎生成（演示模式）',
  knowledge: '校园位置知识表 v1'
};
const CLOUD_SHAPES = {
  cumulus: '<ellipse cx="14" cy="14" rx="9" ry="6"/><ellipse cx="24" cy="11" rx="10" ry="8"/><ellipse cx="31" cy="15" rx="6" ry="5"/>',
  cumulonimbus: '<path d="M8 18c0-5 3-8 8-9 2-4 8-5 11 0 4-1 7 2 7 7 0 1-1 2-2 2z"/><path d="M10 18h21"/>',
  stratus: '<rect x="5" y="11" width="30" height="6" rx="3"/><rect x="9" y="17" width="22" height="3.6" rx="1.8"/>',
  stratocumulus: '<ellipse cx="11" cy="14" rx="7" ry="5"/><ellipse cx="21" cy="11" rx="7" ry="5"/><ellipse cx="31" cy="15" rx="6" ry="4.4"/>',
  altocumulus: '<circle cx="10" cy="13" r="3"/><circle cx="17" cy="10" r="3"/><circle cx="24" cy="13" r="3"/><circle cx="31" cy="10" r="3"/>',
  cirrus: '<path d="M6 15c9-7 19-9 29-6"/><path d="M10 19c7-4 14-5 21-4"/>'
};

const SAMPLE_RECORD = {
  cloud_type: '积云',
  points: {
    height_ref: '云底约在楼顶两三层高，可对照远处楼房层数',
    light: '顺光面明亮、背光面偏灰，侧向测光更易看出体积',
    form: '团块状、边缘清晰，底部相对平坦',
    time_place: '17:40 · 气象楼前 · 云在东侧'
  },
  note: '气象楼前 · 积云：云底齐到楼顶，东侧更亮，往北缓慢移动。',
  tags: ['积云', '午后']
};

const SEED_ALBUM = [
  {
    id: 'seed-1',
    cloud_type: '积云',
    note: '气象楼前 · 积云：云底齐到楼顶，东侧更亮，往北缓慢移动。',
    tags: ['积云', '午后'],
    place: '17:40 · 气象楼前',
    height_ref: '云底约在楼顶两三层高，可对照远处楼房层数'
  },
  {
    id: 'seed-2',
    cloud_type: '层积云',
    note: '群英河步道 · 层积云：成片铺开，云隙透光在地面形成光斑。',
    tags: ['层积云', '有风'],
    place: '16:20 · 群英河步道',
    height_ref: '云底在楼宇上层，成片铺开但保留间隙'
  }
];
