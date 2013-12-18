Fruitbots "Look a Lot"
======================

This simple-sample bot is my first attempt for the Fruitbots https://github.com/scribd/robot-fruit-hunt challenge

Bot strategy:
* If on a useful fruit, eat it!
* Else, go to the best direction, looking at:
  * nearer and rarer fruits
  * bonus if nearer than the opponent
  * bonus for disputed fruits, if nearer than the opponent
  * avoid previous position, out of the border moves and to PASS
