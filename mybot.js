/*
LOOK A LOT STRATEGY:
- if on a useful fruit, eat it
- go to the best direction, looking at:
  - nearer and rarer fruits
  - bonus if nearer than the opponent
  - bonus for disputed fruits, if nearer than the opponent
  - avoid previous position, out of the border moves and to PASS
*/
var previous_position;


function new_game() {
  previous_position = [get_my_x(), get_my_y()];
}


function make_move() {
  var board = get_board();
  
  var ignored_abundand_fruit = get_ignored_abundand_fruit();
  
  // we found an item! take it! UNLESS IT'S USELESS OR INITIALLY MOST ABUNDANT
  var here = board[get_my_x()][get_my_y()];
  if (here > 0 && !useless_fruit(here) && here != ignored_abundand_fruit) {
    previous_position = [9999,9999];
    return TAKE;
  }
  
  var go_north =0, go_west =0, go_south =0, go_east =0;

  for (y=0;y<HEIGHT;y++){
    for (x=0;x<WIDTH;x++){
      // avoid previous position
      if (x == previous_position[0] && y == previous_position[1]) {
        if (x > get_my_x()) {          go_east  -= 2;
        } else if (x < get_my_x()) {   go_west  -= 2;
        } else if (y > get_my_y()) {   go_south -= 2;
        } else if (y < get_my_y()) {   go_north -= 2;
        }
      }

      // if void, or useless fruit or ignored abundant fruit, don't take it
      if (board[x][y] == 0 || useless_fruit(board[x][y]) || board[x][y] == ignored_abundand_fruit) {
        continue;
      }
        
      var fruit_val = 1;
      // weight proportional to proximity and rarity
      fruit_val += fruit_proximity(x,y) * fruit_rarity(board[x][y]);
      
      trace('cell ['+x+','+y+'] fruit_val: '+(fruit_val-1)+' ('+fruit_proximity(x,y)+'p * '+fruit_rarity(board[x][y])+'r)');

      // if nearer than the opponent
      if (cell_my_distance(x,y) < cell_opponent_distance(x,y)) {
        // bonus value = 1/4 of rarity
        fruit_val += Math.min(3, ( fruit_rarity(board[x][y]) / 4 ) );
        
        // disputed fruit
        if (Math.min(get_my_x(),get_opponent_x()) <= x && x <= Math.max(get_my_x(),get_opponent_x()) 
        &&  Math.min(get_my_y(),get_opponent_y()) <= y && y <= Math.max(get_my_y(),get_opponent_y())) {
          // bonus value = 1/2 of rarity
          fruit_val += Math.min(3, ( fruit_rarity(board[x][y]) / 2 ) );
        }
      }

      if (x > get_my_x()) {        go_east  += fruit_val;
      } else if (x < get_my_x()) { go_west  += fruit_val;
      }
      if (y > get_my_y()) {        go_south += fruit_val;
      } else if (y < get_my_y()) { go_north += fruit_val;
      }
    }
  }
  
  // avoid going out of the border
  if (get_my_x()==0         ) { go_west  = -999; }
  if (get_my_x()==(WIDTH-1) ) { go_east  = -999; }
  if (get_my_y()==0         ) { go_north = -999; }
  if (get_my_y()==(HEIGHT-1)) { go_south = -999; }
  
  // now decide: ALWAYS AVOID PASS
  var decision = NORTH, max = go_north;
  if (go_west  > max) { decision = WEST;  max = go_west;  }
  if (go_east  > max) { decision = EAST;  max = go_east;  }
  if (go_south > max) { decision = SOUTH; max = go_south; }

  var decision_string = ['','EAST','NORTH','WEST','SOUTH'];
  
  trace('in ['+get_my_x()+','+get_my_y()+'] -> '+decision_string[decision]+' || n:'+Math.round(go_north) +' s:'+ Math.round(go_south) +' w:'+Math.round(go_west) +' e:'+ Math.round(go_east) +' || ab:'+ignored_abundand_fruit);
  
  previous_position = [get_my_x(), get_my_y()];

  return decision;
}


function get_ignored_abundand_fruit () {

  // release the constraint after the game first half or if there's too few fruits
  if ( release_abundand_fruit_constraint() || get_number_of_item_types() <= 3 ) {
    return 0;
  }
  
  var res = 1;
  var max_abundance = get_total_item_count(1);

  for (i=2;i<=get_number_of_item_types();i++){
    if (get_total_item_count(i) > max_abundance) {
      res = i;
      max_abundance = get_total_item_count(i);
    }
  }
  return res;
}


function release_abundand_fruit_constraint () {
  var tot_fruit_types_available = 0;
  for (i=1;i<=get_number_of_item_types();i++){
    if ((get_total_item_count(i) - get_opponent_item_count(i) - get_my_item_count(i)) > 0 && !useless_fruit(i)) {
      tot_fruit_types_available++;
    }
  }
  // release the constraint if there's too few fruit types
  return (tot_fruit_types_available <= Math.floor(get_number_of_item_types()/2)); 
}

function cell_my_distance(x,y) {
  return (Math.abs(y - get_my_y()) + Math.abs(x - get_my_x()));
}

function cell_opponent_distance(x,y) {
  return (Math.abs(y - get_opponent_y()) + Math.abs(x - get_opponent_x()));
}

function fruit_proximity (x,y) {
  return round_decimals( (Math.max(WIDTH,HEIGHT) - 2) / cell_my_distance(x,y) ,1);
}

function round_decimals(number, decimals) {
  return Math.round( number *Math.pow(10,decimals)) / Math.pow(10,decimals);
} 

function fruit_rarity (fruit) {
  // mixed value given by rarity and utility
  var rarity = Math.round( tot_available_fruits() / ( get_total_item_count(fruit) - get_my_item_count(fruit) - get_opponent_item_count(fruit) ));
  // correct excessive values
  if (rarity > (tot_available_fruits()/2)) {
    rarity = tot_available_fruits()/2;
  }

  // if unbalances the fruit counts
  if (get_my_item_count(fruit) <= get_opponent_item_count(fruit) && (get_my_item_count(fruit)+1)>get_opponent_item_count(fruit)) {
    rarity += 0.5;
  }
  // if it's the last fruit of its type and unbalances the fruit counts (when above)
  if ((get_total_item_count(fruit) - get_my_item_count(fruit) - get_opponent_item_count(fruit) == 1) 
  && (
       (get_my_item_count(fruit) <  get_opponent_item_count(fruit) && (get_my_item_count(fruit)+1) >= get_opponent_item_count(fruit))
    || (get_my_item_count(fruit) <= get_opponent_item_count(fruit) && (get_my_item_count(fruit)+1) >  get_opponent_item_count(fruit))
  )) {
    rarity += 2;
  } else 
  // if it's the last fruit of its type and unbalances the fruit counts (when ahead)
  if ((get_total_item_count(fruit) - get_my_item_count(fruit) - get_opponent_item_count(fruit) == 1) 
  && (
       (get_opponent_item_count(fruit) <  get_my_item_count(fruit) && (get_opponent_item_count(fruit)+1) >= get_my_item_count(fruit))
    || (get_opponent_item_count(fruit) <= get_my_item_count(fruit) && (get_opponent_item_count(fruit)+1) >  get_my_item_count(fruit))
  )) {
    rarity += 2;
  }
  return rarity;
}

function useless_fruit (type) {
  // useless fruit: someone already have most
  return ( get_opponent_item_count(type) > (get_total_item_count(type)/2) || get_my_item_count(type) > (get_total_item_count(type)/2) );
}

function tot_available_fruits () {
  var tot = 0;
  for (i=1;i<=get_number_of_item_types();i++) {
    tot += (get_total_item_count(i) - get_opponent_item_count(i) - get_my_item_count(i));
  }
  return tot;
}
