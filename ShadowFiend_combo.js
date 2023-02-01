let block;
let razeBlock;
let wait_cyclone = false;
let razeFlag;
let useRazes;
let soulsToUse;
let to_delete_update;
const heroname = "npc_dota_hero_nevermore";
let abilities = {
  item_black_king_bar: true,
  item_blink: true,
  item_cyclone: true,
  item_wind_waker: true,
  nevermore_requiem: true,
  item_heavens_halberd: true,
  item_gungir: true,
  item_nullifier: true,
  item_sheepstick: true,
  item_mjollnir: true,
  item_orchid: true,
  item_bloodthorn: true,
  item_minotaur_horn: false,
  item_diffusal_blade: true,
  item_lotus_orb: true,
  item_bullwhip: true,
};
let abilities_to_crush_linkin = {
  item_heavens_halberd: true,
  item_orchid: true,
  item_dagon: true,
  item_rod_of_atos: true,
  item_force_staff: true,
  item_hurricane_pike: true,
  item_diffusal_blade: true,
  item_sheepstick: false,
  item_bloodthorn: false,
  item_psychic_headband: true,
};
let enabled = null;
if (!Game.SF_particles) Game.SF_particles = []
let radius = 150;
let radiusToTarget;
let my_pos;
let my_for;
let RAZES_SCALE = [200,450,700];
let colorNotActive = [128, 128, 128];
let colorWithoutEnemy = [255, 0, 0];
let colorWithEnemy = [0, 255, 0];
let enemycolor = [];
let razes = ["nevermore_shadowraze1","nevermore_shadowraze2","nevermore_shadowraze3"]

function move_prediction(unit){
  unit_pos = unit.getAbsOrigin;
  unit_for = unit.getForward;
  unit_ms = unit.getMoveSpeed;
  me = CPlayer.GetLocalCEntity();
  ability = me.SearchAbility("nevermore_shadowraze1");
  if (unit.isRunning){
    return sVector3.add(unit_pos, sVector3.scaled(unit_for, (unit_ms * ability.getCastPoint)))
  } else {
    return unit_pos
  }
  
}
//Отрисовка койлов
Project.OnDraw(function(){   
  let me = CPlayer.GetLocalCEntity(); 
  if (razeBlock && razeFlag){
    use_coil();
  }
  if (Project.IsInGame() && enabled && me.isAlive && me.SearchAbility("nevermore_shadowraze1").getLevel>0){
      

      let enemies = CPlayer.GetHeroesEnemyCEntity().filter((t)=>{return t.canBeAttackedMagically && me.DistanceTo(t)<950 && !t.isDormantHero});
      my_pos = me.getAbsOrigin;
      my_for = me.getForward;

      for (let i = 0; i < 3; i++) {
          const pos = sVector3.add(my_pos, sVector3.scaled(my_for, RAZES_SCALE[i]))
          
          //console.log(enemies);
          if (!Game.SF_particles[i]) {
              //console.log(`Before create, i: ${i}, pos: ${pos}`);

              Game.SF_particles[i] = Particles.CreateParticle("particles/ui_mouseactions/drag_selected_ring.vpcf", ParticleAttachment_t.PATTACH_ABSORIGIN, me.entityID);
              //console.log(`Created particle id: ${ Game.SF_particles[i] }`);
              Particles.SetParticleControl(Game.SF_particles[i], 2, [radius, 255, 255])
          }
          enemycolor=[0,0,0]
//Проверка противников в радиусе койлов
          enemies.forEach((t) => { 
              xyz=t.getAbsOrigin
              if ((pos[0]-xyz[0])*(pos[0]-xyz[0])+(pos[1]-xyz[1])*(pos[1]-xyz[1])<=(250*250)){
                  enemycolor[i] +=1;
              } 
            
          });

//Объявление цвета радиуса койлов
          Particles.SetParticleControl(Game.SF_particles[i], 0, pos)
          if(enemycolor[i]>0 && me.SearchAbility(razes[i]).isReady){
              Particles.SetParticleControl(Game.SF_particles[i], 1, colorWithEnemy)  
          } else if (me.SearchAbility(razes[i]).isReady){
              Particles.SetParticleControl(Game.SF_particles[i], 1, colorWithoutEnemy)
          } else{
              Particles.SetParticleControl(Game.SF_particles[i], 1, colorNotActive)
          }   

      }
  } 
})
//время каста реквиема
function time_to_req() {
  let me = CPlayer.GetLocalCEntity();
  if (me.SearchBuff("modifier_item_arcane_blink_buff").buffID !== -1) {
    //console.log("APPROVED TIME");
    return 0.835;
  } else {
    //console.log("1.7");
    return 1.67;
  }
}

//поиск модифаеров
Project.OnModifierCreate((param) => {
  // console.log(param);
  if ((param.modifier_name=="modifier_eul_cyclone" || param.modifier_name=="modifier_wind_waker") && block){
    Project.Timer(0.06,()=>{
      block = false;
      //console.log(block);
    })

  } else if (block) {
    Project.Timer(0.06,(block = false))
  }
  if (param.modifier_name == 'modifier_nevermore_requiem_fear' && RazesEnabled){
    razeBlock = true;
    //console.log("RAZE RAZE");
    Project.Timer(2.5,()=>{
      razeBlock = false;
      razeFlag = true;
      ApiEngine.ClearOrdersQueue();
    })
  
  }
   //console.log("OnModifierCreate ", param.modifier_name);
});


//расчет времени до реквиема
function wait_before_req() {
  //console.log("TRYING TO CALCULATE TIME BEFORE ULT");
  let me = CPlayer.GetLocalCEntity();
  let target = Api.GetTargetNew(me, CPlayer.GetHeroesEnemyCEntity());
  let cyclone_buff = target.SearchBuff("modifier_eul_cyclone");
  let wind_waker_buff = target.SearchBuff("modifier_wind_waker");
  let time;
  //console.log(`Eul buff: ${JSON.stringify(cyclone_buff)}`);
  if (target.SearchBuff("modifier_eul_cyclone").buffID !== -1) {
    time = cyclone_buff.getRemainingTime - time_to_req()
    //console.log(cyclone_buff.getRemainingTime);
    //console.log(time);
        return time
  } else if (target.SearchBuff("modifier_wind_waker").buffID !== -1) {
    time = wind_waker_buff.getRemainingTime - time_to_req();
    //console.log(time);
    return time;
  } else {
    return 0.1;
  }
}
let use_coil = () => {
  let me = CPlayer.GetLocalCEntity();
  let target = Api.GetTargetNew(me, CPlayer.GetHeroesEnemyCEntity());
  if (target.entityID === -1) return;
  if (target.isMagicImmune) {
    me.SendOrderAttackTarget(target, false);
    return;
  }
  my_pos = me.getAbsOrigin;
  let my_for = me.getForward; 
  for (let i = 0; i < 3; i++) {
    xyz = move_prediction(target); 
    raze = me.SearchAbility(razes[i])
    const pos = sVector3.add(my_pos, sVector3.scaled(my_for, RAZES_SCALE[i]))
    if ((pos[0]-xyz[0])*(pos[0]-xyz[0])+(pos[1]-xyz[1])*(pos[1]-xyz[1])<=(240*240) && raze.isReady){
      me.SendOrderCastNoTarget(raze);

    }
  }
 
}
//комбо
let combo_tick = () => {
  
  let me = CPlayer.GetLocalCEntity();
  let target = Api.GetTargetNew(me, CPlayer.GetHeroesEnemyCEntity());

  let buff = me.SearchBuff("modifier_nevermore_necromastery");
  if (buff.getStackCount < soulsToUse) return; 

  if (target.entityID === -1) return;
  if (target.isMagicImmune) {
    me.SendOrderAttackTarget(target, false);
    return;
  }

  if (target.isLinkenProtected) {
    for (let ability_name in abilities_to_crush_linkin) {
      if (!abilities_to_crush_linkin[ability_name]) {
        continue;
      }

      let ability = me.SearchAbilityOrItem(ability_name);

      me.SendOrderAutoCast(ability, target);
    }
    return;
  }
  {
    if (me.DistanceTo(target) > 1200) {
      me.SendOrderMoveToTarget(target);
      return;
    }
  }
 
  let casttime=0.03
  for (let ability_name in abilities) {
    if (!abilities[ability_name]) {
      continue;
    }
    //console.log(`BLOCKED? = ${block}`);
    if (block || razeBlock) return;

    let ability;
    //console.log(ability_name);

    ability = me.SearchAbilityOrItem(ability_name);
// блинки
blink = me.SearchAbilityOrItem("item_blink");
acrane_blink = me.SearchAbilityOrItem("item_arcane_blink");
swift_blink = me.SearchAbilityOrItem("item_swift_blink");
    if (ability_name === "item_blink") {
      if (
        ability.abilityID === -1 &&
        me.SearchAbilityOrItem("item_arcane_blink").abilityID !== -1
      ) {
        ability = me.SearchAbilityOrItem("item_arcane_blink");
      } else if (
        ability.abilityID === -1 &&
        me.SearchAbilityOrItem("item_swift_blink").abilityID !== -1
      ) {
        ability = me.SearchAbilityOrItem("item_swift_blink");
      } else if (
        ability.abilityID === -1 &&
        me.SearchAbilityOrItem("item_overwhelming_blink").abilityID !== -1
      ) {
        ability = me.SearchAbilityOrItem("item_overwhelming_blink");
      }
    }
    if (!abilities["item_blink"] || (blink.abilityID!==-1 && acrane_blink.abilityID!==-1 && swift_blink.abilityID!==-1) || 
    (!swift_blink.isReady && !acrane_blink.isReady && !blink.isReady)){
      if (me.DistanceTo(target) > 400) {
        me.SendOrderMoveToTarget(target);
        return;
      }
    }
    if (!ability.isReady) {
      continue;
    }
    // каст еулов
    if (ability_name=="item_cyclone" || ability_name == "item_wind_waker"){
      block = true;
      me.SendOrderAutoCast(ability, target, target.getAbsOrigin, true);
      me.SendOrderMoveToTarget(target);
      return;
    }
    // ульт
      if (ability_name=="nevermore_requiem"){
        //console.log("CAST REQUIEM");
            Project.Timer(wait_before_req(),()=>{
                me.SendOrderAutoCast(ability,target,target.getAbsOrigin,true);
            });
          razeFlag = true;
          continue;
          }
            me.SendOrderAutoCast(ability, target, target.getAbsOrigin, true)
     
    //console.log("CAST");

  }
};
/*
выход из игры, отчистка скрипта
удаляем партикли проверяя геймстете
*/
function destroy() {

  if (Game.SF_particles) {
      try {
          for(const particleKey of Object.keys(Game.SF_particles))
          {
              Project.DestroyParticle(Game.SF_particles[particleKey], false);
              Game.SF_particles[particleKey] = null
          }
      } catch (e) {

      }
      Game.SF_particles = {};
  }
}

Project.OnGameStateChanged(function (state_number) {

  if(!Project.IsInGame())
  {
      destroy();
  }

});

Project.OnDestroy(destroy);

ScriptsHandler.CreateToggle("Heroes/ShadowFiend/Razes Settings","Shadowraze radius",function (st,obj) {

  enabled = st;

  if(obj.autostart) return;

  if(Project.IsInGame() && !enabled)
  {
      destroy();
  }

},enabled,{autostart:true});
ScriptsHandler.CreateDecarativeLine("Heroes/ShadowFiend", "dec2", 10, -5);

ScriptsHandler.CreateKey(
  "Heroes/ShadowFiend",
  "Keybind",
  function (pressed, key) {
    if (heroname === CPlayer.GetLocalCEntity().getName) {
      if (pressed && !to_delete_update && Project.IsInGame()) {
        to_delete_update =  Project.OnUpdate(combo_tick);
      } else if (to_delete_update) {
        to_delete_update();
        to_delete_update = null;
        ApiEngine.ClearOrdersQueue();
      }
    }
  })
  
ScriptsHandler.CreateAbilities(
  "Heroes/ShadowFiend",
  "Abilities to cast ",
  abilities,
  function (abilities_, ability_changed, obj) {
    abilities = abilities_;
  },
  true,
  null,
  { width: 380 }
);

ScriptsHandler.CreateAbilities(
  "Heroes/ShadowFiend",
  "Abilities to break linken",
  abilities_to_crush_linkin,
  function (abilities_, ability_changed, obj) {
    abilities_to_crush_linkin = abilities_;
  },
  false,
  null,
  { width: 280 }
);

ScriptsHandler.CreateToggle("Heroes/ShadowFiend/Razes Settings","User razes in combo",function (st,obj) {
  RazesEnabled = st;
})

ScriptsHandler.CreateKey(
  "Heroes/ShadowFiend/Razes Settings",
  "Use Razes",
  function (pressed, key) {
    if (heroname === CPlayer.GetLocalCEntity().getName) {
      if (pressed && !to_delete_update && Project.IsInGame()) {
        to_delete_update =  Project.OnUpdate(use_coil);
      } else if (to_delete_update) {
        to_delete_update();
        to_delete_update = null;
        ApiEngine.ClearOrdersQueue();
      }
    }
  })
  
ScriptsHandler.CreateDecarativeLine("Heroes/ShadowFiend", "dec1", 10, -5);
ScriptsHandler.CreateSlider("Heroes/ShadowFiend","Souls to use combo ",function (value) {

  soulsToUse = value;

},[0,25]);
ScriptsHandler.CreateDecarativeLine("Heroes/ShadowFiend", "dec2", 10, -5);
