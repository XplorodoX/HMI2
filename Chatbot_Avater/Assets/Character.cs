using System.Linq;
using UnityEngine;

public class Character : MonoBehaviour
{
    public string voice;
    public SkinnedMeshRenderer skinnedMeshRenderer = null;
    public VisemeMap[] visemeToBlendTargets = new VisemeMap[OVRLipSync.VisemeCount];
}
